import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/auth.middleware';
import { documentsService } from '../services/domain.service';
import { StorageService } from '../services/storage.service';
import { asyncHandler } from '../utils/asyncHandler';

const upload = multer({ storage: multer.memoryStorage() });
export const documentsRouter = Router();

documentsRouter.post('/upload', authenticate, upload.single('file'), asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: { message: 'No file provided' } });
    return;
  }

  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ error: { message: 'Unauthorized' } });
    return;
  }

  const file = req.file;
  const fileName = `${userId}/${Date.now()}_${file.originalname}`;
  const upload = await StorageService.uploadResume(fileName, file.buffer, file.mimetype);

  // Create document record
  const doc = await documentsService.create({
    ownerUserId: userId,
    storagePath: upload.path,
    fileName: file.originalname,
    mimeType: file.mimetype,
    sizeBytes: file.size,
    documentType: 'resume'
  });

  res.status(201).json({ success: true, data: doc });
}));
