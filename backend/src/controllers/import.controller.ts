import { Request, Response } from 'express';
import { zipImportService } from '../services/import/zip-import.service';

interface MulterRequest extends Request {
    file?: Express.Multer.File;
}

export const importZip = async (req: MulterRequest, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        const result = zipImportService.processZipFile(req.file.buffer);

        res.json({
            success: true,
            data: {
                content: result.content,
                filename: result.filename,
                originalName: req.file.originalname
            }
        });
    } catch (error: any) {
        console.error('Zip import error:', error);
        res.status(500).json({ success: false, error: error.message || 'Failed to process zip file' });
    }
};
