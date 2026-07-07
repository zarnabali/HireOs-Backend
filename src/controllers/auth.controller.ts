import type { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { sendSuccess } from '../utils/apiResponse';

export class AuthController {
  static async register(req: Request, res: Response) {
    const session = await AuthService.register(req.body);
    return sendSuccess(res, session, 201);
  }

  static async login(req: Request, res: Response) {
    const session = await AuthService.login(req.body);
    return sendSuccess(res, session);
  }

  static async refresh(req: Request, res: Response) {
    const session = await AuthService.refresh(req.body.refreshToken);
    return sendSuccess(res, session);
  }

  static async logout(req: Request, res: Response) {
    const result = await AuthService.logout(req.body.refreshToken);
    return sendSuccess(res, result);
  }

  static async me(req: Request, res: Response) {
    return sendSuccess(res, req.user);
  }
}
