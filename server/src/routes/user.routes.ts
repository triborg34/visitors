import { Router } from 'express';
import { prisma } from '../config/prisma';
import { requireAdmin, requireAuth } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { createUserSchema, resetPasswordSchema, updateUserSchema } from '../validators/user.validator';
import { ApiError, asyncHandler, paginate } from '../utils/http';
import { hashPassword } from '../utils/password';
import { clientIp, recordAudit } from '../services/audit.service';
import { normalizeText } from '../utils/persian';

export const userRouter = Router();

userRouter.use(requireAuth, requireAdmin);

userRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const query = req.query as Record<string, string | undefined>;
    const { page, pageSize, skip, take } = paginate(query.page, query.pageSize);
    const search = normalizeText(query.search);
    const where = {
      deletedAt: null,
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive === 'true' ? { isActive: true } : {}),
      ...(query.isActive === 'false' ? { isActive: false } : {}),
      ...(search
        ? {
            OR: [
              { fullName: { contains: search } },
              { username: { contains: search } },
              { phone: { contains: search } },
            ],
          }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          fullName: true,
          phone: true,
          email: true,
          role: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          mustChangePassword: true,
          activeExhibitionId: true,
          activeExhibition: { select: { id: true, name: true } },
          _count: { select: { registeredVisits: { where: { deletedAt: null } } } },
        },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      success: true,
      data: items.map((u) => ({ ...u, registeredVisits: u._count.registeredVisits })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  }),
);

userRouter.post(
  '/',
  validate(createUserSchema),
  asyncHandler(async (req, res) => {
    const body = req.body as {
      username: string;
      fullName: string;
      phone?: string;
      email?: string;
      password: string;
      role: string;
      activeExhibitionId?: string;
    };

    const existing = await prisma.user.findUnique({ where: { username: body.username } });
    if (existing) throw ApiError.conflict('این نام کاربری قبلاً ثبت شده است.');

    if (body.activeExhibitionId) {
      const exhibition = await prisma.exhibition.findUnique({
        where: { id: body.activeExhibitionId },
      });
      if (!exhibition) throw ApiError.badRequest('نمایشگاه انتخاب‌شده معتبر نیست.');
    }

    const user = await prisma.user.create({
      data: {
        username: body.username,
        fullName: body.fullName,
        phone: body.phone ?? null,
        email: body.email ?? null,
        passwordHash: await hashPassword(body.password),
        role: body.role,
        isActive: true,
        mustChangePassword: true,
        activeExhibitionId: body.activeExhibitionId ?? null,
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    await recordAudit({
      userId: req.user!.sub,
      action: 'USER_CREATED',
      entity: 'User',
      entityId: user.id,
      details: { username: user.username, role: user.role },
      ip: clientIp(req),
    });

    res.status(201).json({ success: true, data: user });
  }),
);

userRouter.patch(
  '/:id',
  validate(updateUserSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const body = req.body as Record<string, unknown>;

    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('کاربر یافت نشد.');

    if (id === req.user!.sub && body.isActive === false) {
      throw ApiError.badRequest('امکان غیرفعال کردن حساب کاربری خودتان وجود ندارد.');
    }
    if (id === req.user!.sub && body.role && body.role !== existing.role) {
      throw ApiError.badRequest('امکان تغییر نقش حساب کاربری خودتان وجود ندارد.');
    }

    const data: Record<string, unknown> = {};
    if (body.fullName !== undefined) data.fullName = body.fullName;
    if (body.phone !== undefined) data.phone = body.phone ?? null;
    if (body.email !== undefined) data.email = body.email ?? null;
    if (body.role !== undefined) data.role = body.role;
    if (body.isActive !== undefined) data.isActive = body.isActive;
    if (body.mustChangePassword !== undefined) data.mustChangePassword = body.mustChangePassword;
    if (body.activeExhibitionId !== undefined) {
      const exhibitionId = body.activeExhibitionId as string | null;
      if (exhibitionId) {
        const exhibition = await prisma.exhibition.findUnique({ where: { id: exhibitionId } });
        if (!exhibition) throw ApiError.badRequest('نمایشگاه انتخاب‌شده معتبر نیست.');
      }
      data.activeExhibitionId = exhibitionId;
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
        email: true,
        role: true,
        isActive: true,
        mustChangePassword: true,
        activeExhibitionId: true,
      },
    });

    await recordAudit({
      userId: req.user!.sub,
      action: 'USER_UPDATED',
      entity: 'User',
      entityId: id,
      details: data,
      ip: clientIp(req),
    });

    res.json({ success: true, data: user });
  }),
);

userRouter.post(
  '/:id/reset-password',
  validate(resetPasswordSchema),
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    const { newPassword, mustChangePassword } = req.body as {
      newPassword: string;
      mustChangePassword: boolean;
    };
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('کاربر یافت نشد.');

    await prisma.user.update({
      where: { id },
      data: {
        passwordHash: await hashPassword(newPassword),
        mustChangePassword,
      },
    });

    await recordAudit({
      userId: req.user!.sub,
      action: 'USER_PASSWORD_RESET',
      entity: 'User',
      entityId: id,
      ip: clientIp(req),
    });

    res.json({ success: true, data: { message: 'رمز عبور بازنشانی شد.' } });
  }),
);

userRouter.delete(
  '/:id',
  asyncHandler(async (req, res) => {
    const id = req.params.id as string;
    if (id === req.user!.sub) throw ApiError.badRequest('امکان حذف حساب کاربری خودتان وجود ندارد.');
    const existing = await prisma.user.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) throw ApiError.notFound('کاربر یافت نشد.');

    await prisma.user.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false },
    });

    await recordAudit({
      userId: req.user!.sub,
      action: 'USER_DELETED',
      entity: 'User',
      entityId: id,
      ip: clientIp(req),
    });

    res.json({ success: true, data: { message: 'کاربر حذف شد.' } });
  }),
);
