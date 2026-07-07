export type UserRole = 'candidate' | 'recruiter' | 'admin';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  companyIds: string[];
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;
  companyIds: string[];
}
