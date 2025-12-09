import express from 'express';
import multer from 'multer';
import { importTemplateFromPdf } from '../controllers/templates.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/templates/import - Import template from PDF
router.post('/import', optionalAuthMiddleware, upload.single('file'), importTemplateFromPdf);

export default router;
