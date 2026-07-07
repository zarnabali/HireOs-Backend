import { env } from '../config/env';
import { supabaseAdmin } from '../config/supabase';
import { AppError } from '../utils/errors';

const bucketStatus = new Map<string, boolean>();

export class StorageService {
  static get resumeBucket() {
    return env.SUPABASE_STORAGE_BUCKET;
  }

  static async ensureBucket(bucketName = env.SUPABASE_STORAGE_BUCKET) {
    if (bucketStatus.get(bucketName)) return;

    const { data: existing, error: getError } = await supabaseAdmin.storage.getBucket(bucketName);
    if (getError) {
      console.error('[StorageService.ensureBucket] getBucket error:', getError);
    }
    if (existing && !getError) {
      bucketStatus.set(bucketName, true);
      return;
    }

    const { error: createError } = await supabaseAdmin.storage.createBucket(bucketName, {
      public: false,
      allowedMimeTypes: [
        'application/pdf',
        'application/x-pdf',
        'application/octet-stream',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ],
      fileSizeLimit: 20 * 1024 * 1024
    });

    if (createError) {
      console.error('[StorageService.ensureBucket] createBucket error:', createError);
      const message = createError.message || 'Unknown Supabase Storage error';
      throw new AppError(
        500,
        'INTERNAL_ERROR',
        `Supabase Storage bucket "${bucketName}" is missing and could not be created`,
        { bucketName, cause: message }
      );
    }

    bucketStatus.set(bucketName, true);
  }

  static async uploadResume(path: string, body: Buffer, contentType: string) {
    await this.ensureBucket();

    const { data, error } = await supabaseAdmin.storage
      .from(this.resumeBucket)
      .upload(path, body, {
        contentType,
        upsert: true
      });

    if (error) {
      console.error('[StorageService.uploadResume] Error:', error);
      throw new AppError(
        500,
        'INTERNAL_ERROR',
        `Failed to upload resume to Supabase Storage bucket "${this.resumeBucket}"`,
        { bucketName: this.resumeBucket, cause: error.message }
      );
    }

    return data;
  }

  static async downloadResume(path: string) {
    await this.ensureBucket();

    const { data, error } = await supabaseAdmin.storage.from(this.resumeBucket).download(path);
    if (error || !data) {
      throw new AppError(
        500,
        'INTERNAL_ERROR',
        `Failed to download resume from Supabase Storage bucket "${this.resumeBucket}"`,
        { bucketName: this.resumeBucket, storagePath: path, cause: error?.message }
      );
    }

    return data;
  }
}
