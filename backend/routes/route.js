import express from 'express';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();

const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 20 * 1024 * 1024 },
});

router.post('/upload-pdf', upload.single('pdf'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const isPdf =
    req.file.mimetype === 'application/pdf' ||
    req.file.originalname.toLowerCase().endsWith('.pdf');

  if (!isPdf) {
    return res.status(400).json({ error: 'Only PDF files are allowed.' });
  }

  const uploadedPdfPath = req.file.path;
  const outputTxtPath = path.join(UPLOAD_DIR, `${req.file.filename}.txt`);
  const pythonCommand = process.env.PYTHON || 'python';
  const processorScript = path.join(__dirname, '..', 'python', 'pdf_processor.py');

  const pythonProcess = spawn(
    pythonCommand,
    [processorScript, uploadedPdfPath, outputTxtPath],
    { shell: false },
  );

  let stdout = '';
  let stderr = '';

  pythonProcess.stdout.on('data', (data) => {
    stdout += data.toString();
  });

  pythonProcess.stderr.on('data', (data) => {
    stderr += data.toString();
  });

  pythonProcess.on('error', (error) => {
    return res.status(500).json({
      error: 'Failed to start PDF processor',
      details: error.message,
    });
  });

  pythonProcess.on('close', (code) => {
    const cleanup = () => {
      fs.unlink(uploadedPdfPath, () => {});
      fs.unlink(outputTxtPath, () => {});
    };

    if (code !== 0 || !stdout.includes('SUCCESS')) {
      cleanup();
      return res.status(500).json({
        error: 'Python processing failed',
        details: stderr || stdout || `Process exited with code ${code}`,
      });
    }

    fs.readFile(outputTxtPath, 'utf8', (err, textData) => {
      if (err) {
        cleanup();
        return res.status(500).json({
          error: 'Failed to read extracted text file',
          details: err.message,
        });
      }

      cleanup();
      return res.json({
        message: 'PDF processed successfully',
        extractedText: textData,
      });
    });
  });
});

export default router;
