import crypto from 'crypto';
import jwt, { type SignOptions } from 'jsonwebtoken';
import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import type { AuthUser, JwtPayload } from '../types/auth';
import { AppError } from '../utils/errors';

const TOKEN_BYTES = 48;

function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

export class TokenService {
  static signAccessToken(user: AuthUser) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      companyIds: user.companyIds
    };

    const signOptions: SignOptions = {
      expiresIn: env.JWT_EXPIRES_IN as NonNullable<SignOptions['expiresIn']>,
      issuer: 'hireos-backend',
      audience: 'hireos-app'
    };

    return jwt.sign(payload, env.JWT_SECRET, signOptions);
  }

  static verifyAccessToken(token: string): AuthUser {
    const decoded = jwt.verify(token, env.JWT_SECRET, {
      issuer: 'hireos-backend',
      audience: 'hireos-app'
    }) as JwtPayload;

    return {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role,
      companyIds: decoded.companyIds ?? []
    };
  }

  static async createRefreshToken(userId: string) {
    const token = crypto.randomBytes(TOKEN_BYTES).toString('base64url');
    const tokenHash = hashToken(token);
    const expiresAt = new Date(Date.now() + env.REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabaseAdmin
      .from('refresh_tokens')
      .insert({ user_id: userId, token_hash: tokenHash, expires_at: expiresAt })
      .select('id, expires_at')
      .single();

    if (error) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Failed to create refresh token', error.message);
    }

    return {
      token,
      tokenId: data.id as string,
      expiresAt: data.expires_at as string
    };
  }

  static async rotateRefreshToken(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    const now = new Date().toISOString();

    const { data, error } = await supabaseAdmin
      .from('refresh_tokens')
      .select('id, user_id, expires_at, revoked_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (error) {
      throw new AppError(500, 'INTERNAL_ERROR', 'Failed to read refresh token', error.message);
    }

    if (!data || data.revoked_at || data.expires_at <= now) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid or expired refresh token');
    }

    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked_at: now })
      .eq('id', data.id);

    const user = await this.getAuthUser(data.user_id as string);
    const accessToken = this.signAccessToken(user);
    const nextRefreshToken = await this.createRefreshToken(user.id);

    return { user, accessToken, refreshToken: nextRefreshToken.token, refreshTokenExpiresAt: nextRefreshToken.expiresAt };
  }

  static async revokeRefreshToken(refreshToken: string) {
    const tokenHash = hashToken(refreshToken);
    await supabaseAdmin
      .from('refresh_tokens')
      .update({ revoked_at: new Date().toISOString() })
      .eq('token_hash', tokenHash)
      .is('revoked_at', null);
  }

  static async getAuthUser(userId: string): Promise<AuthUser> {
    const { data: userRow, error } = await supabaseAdmin
      .from('users')
      .select('id, email, role')
      .eq('id', userId)
      .single();

    if (error || !userRow) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'User profile not found');
    }

    const { data: memberships } = await supabaseAdmin
      .from('company_members')
      .select('company_id')
      .eq('user_id', userId);

    return {
      id: userRow.id as string,
      email: userRow.email as string,
      role: userRow.role as AuthUser['role'],
      companyIds: (memberships ?? []).map((membership) => membership.company_id as string)
    };
  }
}
