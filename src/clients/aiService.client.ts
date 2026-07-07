import { env } from '../config/env';
import { AppError } from '../utils/errors';

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
}

export class AiServiceClient {
  private static async request<T>(path: string, options: RequestOptions = {}): Promise<T> {
    const init: RequestInit = {
      method: options.method ?? 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': env.AI_SERVICE_API_KEY
      }
    };

    if (options.body !== undefined) {
      init.body = JSON.stringify(options.body);
    }

    const response = await fetch(`${env.AI_SERVICE_URL}${path}`, init);

    const payload = (await response.json().catch(() => null)) as unknown;

    if (!response.ok) {
      throw new AppError(response.status, 'UPSTREAM_ERROR', 'AI-Service request failed', payload);
    }

    return payload as T;
  }

  static extractResume(payload: unknown) {
    return this.request('/ai/resumes/extract', { body: payload });
  }

  static analyzeResume(payload: unknown) {
    return this.request('/ai/resumes/analyze', { body: payload });
  }

  static matchJobs(payload: unknown) {
    return this.request('/ai/jobs/match', { body: payload });
  }

  static scoreCandidates(payload: unknown) {
    return this.request('/ai/candidates/score-batch', { body: payload });
  }

  static generateInterview(payload: unknown) {
    return this.request('/ai/interviews/generate', { body: payload });
  }

  static evaluateMockInterview(payload: unknown) {
    return this.request('/ai/interviews/mock/evaluate', { body: payload });
  }

  static recruiterChat(payload: unknown) {
    return this.request('/ai/recruiter/chat', { body: payload });
  }

  static candidateChat(payload: unknown) {
    return this.request('/ai/candidate/chat', { body: payload });
  }

  static getTask(taskId: string) {
    return this.request(`/ai/tasks/${taskId}`, { method: 'GET' });
  }
}
