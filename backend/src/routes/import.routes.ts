import { Router } from 'express';
import multer from 'multer';
import { importZip } from '../controllers/import.controller';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.middleware';

const router = Router();
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Allow authenticated users to import
// We can technically allow guests too if we want, but let's stick to auth for now or optional
router.post('/zip', optionalAuthMiddleware, upload.single('file'), importZip);

export default router;
