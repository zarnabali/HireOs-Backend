import { supabaseAdmin, supabasePublic } from '../config/supabase';
import type { RegisterInput, LoginInput } from '../validators/auth.validators';
import { AppError } from '../utils/errors';
import { TokenService } from './token.service';
import type { AuthUser } from '../types/auth';

export class AuthService {
  static async register(input: RegisterInput) {
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: input.email,
      password: input.password,
      email_confirm: true,
      user_metadata: {
        full_name: input.fullName
      },
      app_metadata: {
        role: input.role
      }
    });

    if (authError || !authData?.user) {
      console.error('[AuthService.register] Supabase error:', authError);
      require('fs').appendFileSync('auth-error.log', JSON.stringify(authError, null, 2) + '\n');
      const isConflict = authError?.message?.toLowerCase().includes('already registered') || authError?.message?.toLowerCase().includes('already exists');
      const statusCode = isConflict ? 409 : 400;
      throw new AppError(statusCode, isConflict ? 'CONFLICT' : 'VALIDATION_ERROR', 'Unable to create user', authError?.message);
    }

    const userId = authData.user.id;
    const { error: userError } = await supabaseAdmin.from('users').insert({
      id: userId,
      email: input.email,
      full_name: input.fullName,
      role: input.role
    });

    if (userError) {
      await supabaseAdmin.auth.admin.deleteUser(userId);
      throw new AppError(400, 'VALIDATION_ERROR', 'Unable to create user profile', userError.message);
    }

    if (input.role === 'candidate') {
      await supabaseAdmin.from('candidate_profiles').insert({ user_id: userId });
    }

    if (input.role === 'recruiter') {
      const { data: company, error: companyError } = await supabaseAdmin
        .from('companies')
        .insert({ name: input.companyName ?? `${input.fullName}'s Company` })
        .select('id')
        .single();

      if (companyError || !company) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Unable to create recruiter company', companyError?.message);
      }

      await supabaseAdmin.from('recruiter_profiles').insert({ user_id: userId, company_id: company.id });
      await supabaseAdmin.from('company_members').insert({
        company_id: company.id,
        user_id: userId,
        role: 'owner'
      });
    }

    const user = await TokenService.getAuthUser(userId);
    return this.createSession(user);
  }

  static async login(input: LoginInput) {
    const { data, error } = await supabasePublic.auth.signInWithPassword({
      email: input.email,
      password: input.password
    });

    if (error || !data.user) {
      throw new AppError(401, 'AUTHENTICATION_ERROR', 'Invalid email or password');
    }

    const user = await TokenService.getAuthUser(data.user.id);
    return this.createSession(user);
  }

  static async refresh(refreshToken: string) {
    return TokenService.rotateRefreshToken(refreshToken);
  }

  static async logout(refreshToken: string) {
    await TokenService.revokeRefreshToken(refreshToken);
    return { revoked: true };
  }

  private static async createSession(user: AuthUser) {
    const accessToken = TokenService.signAccessToken(user);
    const refresh = await TokenService.createRefreshToken(user.id);

    return {
      user,
      accessToken,
      refreshToken: refresh.token,
      refreshTokenExpiresAt: refresh.expiresAt
    };
  }
}
