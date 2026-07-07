import { describe, expect, it } from 'vitest';
import { loginSchema, registerSchema } from '../src/validators/auth.validators';
import { jobCreateSchema, resumeCreateSchema } from '../src/validators/domain.validators';
import { publicJobSearchQuerySchema, candidateApplicationCreateSchema } from '../src/validators/marketplace.validators';
import { toSnakeCaseObject } from '../src/utils/case';

describe('auth validators', () => {
  it('normalizes registration email and accepts candidate role', () => {
    const result = registerSchema.parse({
      email: 'USER@EXAMPLE.COM',
      password: 'password123',
      fullName: 'Test Candidate',
      role: 'candidate'
    });

    expect(result.email).toBe('user@example.com');
    expect(result.role).toBe('candidate');
  });

  it('rejects weak login payloads', () => {
    expect(loginSchema.safeParse({ email: 'bad', password: '' }).success).toBe(false);
  });
});

describe('domain validators', () => {
  it('validates job creation payloads', () => {
    const result = jobCreateSchema.parse({
      companyId: '11111111-1111-4111-8111-111111111111',
      title: 'Backend Engineer',
      description: 'Build APIs for the HireOS platform.',
      requiredSkills: ['Node.js', 'Supabase'],
      status: 'open'
    });

    expect(result.remoteType).toBe('onsite');
    expect(result.currency).toBe('USD');
  });

  it('validates structured resume payloads', () => {
    const result = resumeCreateSchema.parse({
      candidateId: '11111111-1111-4111-8111-111111111111',
      title: 'Backend Resume',
      structuredData: {
        skills: ['TypeScript', 'FastAPI']
      }
    });

    expect(result.isPrimary).toBe(false);
  });
});

describe('marketplace validators', () => {
  it('parses public job search query filters', () => {
    const result = publicJobSearchQuerySchema.parse({
      q: 'backend',
      remoteType: 'remote',
      minSalary: '100000',
      page: '2'
    });

    expect(result.minSalary).toBe(100000);
    expect(result.page).toBe(2);
  });

  it('allows candidate apply payloads with optional cover letters', () => {
    const result = candidateApplicationCreateSchema.parse({
      resumeId: '11111111-1111-4111-8111-111111111111',
      coverLetter: 'I am interested in this role.'
    });

    expect(result.source).toBe('hireos');
  });
});

describe('case conversion', () => {
  it('converts nested camelCase payloads to snake_case', () => {
    const result = toSnakeCaseObject({
      companyId: 'company-1',
      requiredSkills: ['Node.js'],
      nestedValue: {
        openToRemote: true
      }
    });

    expect(result).toEqual({
      company_id: 'company-1',
      required_skills: ['Node.js'],
      nested_value: {
        open_to_remote: true
      }
    });
  });
});
