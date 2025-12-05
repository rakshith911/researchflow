import express from 'express';
import multer from 'multer';
import { importTemplateFromPdf } from '../controllers/templates.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/templates/import - Import template from PDF
router.post('/import', authMiddleware, upload.single('file'), importTemplateFromPdf);

export default router;
