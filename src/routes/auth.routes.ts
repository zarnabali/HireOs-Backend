import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { asyncHandler } from '../utils/asyncHandler';
import { loginSchema, logoutSchema, refreshSchema, registerSchema } from '../validators/auth.validators';

export const authRouter = Router();

authRouter.post('/register', validateRequest({ body: registerSchema }), asyncHandler(AuthController.register));
authRouter.post('/login', validateRequest({ body: loginSchema }), asyncHandler(AuthController.login));
authRouter.post('/refresh', validateRequest({ body: refreshSchema }), asyncHandler(AuthController.refresh));
authRouter.post('/logout', validateRequest({ body: logoutSchema }), asyncHandler(AuthController.logout));
authRouter.get('/me', authenticate, asyncHandler(AuthController.me));
