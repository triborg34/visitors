import { z } from 'zod';

export const MESSAGING_PLATFORMS = ['WHATSAPP', 'TELEGRAM', 'BALE', 'EITAA'] as const;

export const updateConnectionSchema = z.object({
  status: z.enum(['UNTESTED', 'CONNECTED', 'FAILED', 'DISABLED']).optional(),
  apiToken: z.string().max(500).optional().nullable(),
  botId: z.string().max(100).optional().nullable(),
  note: z.string().max(1000).optional().nullable(),
});

export const testConnectionSchema = z.object({
  platform: z.enum(MESSAGING_PLATFORMS),
  testPhone: z.string().min(9).max(20).optional(),
});
