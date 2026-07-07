import { supabaseAdmin } from '../config/supabase';
import { AppError, notFound } from '../utils/errors';
import { getPagination, type PaginationInput } from '../utils/pagination';
import { toSnakeCaseObject } from '../utils/case';

export interface ListOptions extends PaginationInput {
  filters?: Record<string, string | number | boolean | null | undefined>;
  orderBy?: string;
  ascending?: boolean;
}

export class BaseService<TCreate extends Record<string, unknown>, TUpdate extends Record<string, unknown>> {
  constructor(private readonly tableName: string) {}

  async list(options: ListOptions = {}) {
    const { page, limit, from, to } = getPagination(options);
    let query = supabaseAdmin.from(this.tableName).select('*', { count: 'exact' }).range(from, to);

    for (const [key, value] of Object.entries(options.filters ?? {})) {
      if (value !== undefined) query = query.eq(key, value);
    }

    query = query.order(options.orderBy ?? 'created_at', { ascending: options.ascending ?? false });

    const { data, error, count } = await query;
    if (error) throw new AppError(500, 'INTERNAL_ERROR', `Failed to list ${this.tableName}`, error.message);

    return { rows: data ?? [], pagination: { page, limit, total: count ?? 0 } };
  }

  async getById(id: string) {
    const { data, error } = await supabaseAdmin.from(this.tableName).select('*').eq('id', id).maybeSingle();
    if (error) throw new AppError(500, 'INTERNAL_ERROR', `Failed to fetch ${this.tableName}`, error.message);
    if (!data) throw notFound(this.tableName);
    return data;
  }

  async create(payload: TCreate) {
    const { data, error } = await supabaseAdmin.from(this.tableName).insert(toSnakeCaseObject(payload)).select('*').single();
    if (error) throw new AppError(400, 'VALIDATION_ERROR', `Failed to create ${this.tableName}`, error.message);
    return data;
  }

  async update(id: string, payload: TUpdate) {
    const { data, error } = await supabaseAdmin
      .from(this.tableName)
      .update({ ...toSnakeCaseObject(payload), updated_at: new Date().toISOString() })
      .eq('id', id)
      .select('*')
      .maybeSingle();

    if (error) throw new AppError(400, 'VALIDATION_ERROR', `Failed to update ${this.tableName}`, error.message);
    if (!data) throw notFound(this.tableName);
    return data;
  }

  async delete(id: string) {
    const { error } = await supabaseAdmin.from(this.tableName).delete().eq('id', id);
    if (error) throw new AppError(400, 'VALIDATION_ERROR', `Failed to delete ${this.tableName}`, error.message);
    return { id };
  }
}
