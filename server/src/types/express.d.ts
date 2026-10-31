import type { TokenPayload } from '../utils/jwt';

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload;
      csrfToken?: string;
    }
  }
}

export {};
