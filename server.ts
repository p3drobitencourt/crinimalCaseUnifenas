import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import cookieParser from 'cookie-parser';
import { createServer as createViteServer } from 'vite';

const prisma = new PrismaClient();

const suspectSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  course: z.string().min(1, 'Course is required'),
});

const sentenceSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  is_active: z.boolean().default(true),
});

const judgementSchema = z.object({
  user_id: z.string().uuid(),
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cookieParser());

  const uploadDir = path.join(process.cwd(), 'public', 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const storage = multer.diskStorage({
    destination: uploadDir,
    filename: (req, file, cb) => {
      const ext = path.extname(file.originalname);
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${ext}`);
    }
  });
  const upload = multer({ storage });

  const requireAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (req.cookies.admin_token === 'classified_access') {
      return next();
    }
    res.status(401).json({ error: 'Unauthorized HQ access' });
  };

  // 1. Rota Pública (/suspect-entry) -> API
  app.post('/api/suspects', upload.single('photo'), async (req: express.Request, res: express.Response) => {
    try {
      const { name, course } = suspectSchema.parse(req.body);
      
      if (!req.file) {
        return res.status(400).json({ error: 'Photo is required' });
      }
      
      const photo_url = `/uploads/${req.file.filename}`;
      
      const user = await prisma.user.create({
        data: { name, course, photo_url }
      });
      
      res.json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: (error as z.ZodError).errors });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/suspects', requireAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const suspects = await prisma.user.findMany({
        include: { draws: { include: { sentence: true } } },
        orderBy: { name: 'asc' }
      });
      res.json(suspects);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/suspects/:id', requireAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      
      // Delete associated draws first to avoid foreign key constraint errors
      await prisma.draw.deleteMany({ where: { user_id: id } });
      
      const suspect = await prisma.user.delete({ where: { id } });
      res.json(suspect);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admin Auth
  app.post('/api/auth/login', (req: express.Request, res: express.Response) => {
    const { password } = req.body;
    if (password === 'admin123') { // Simple hardcoded password as requested
      res.cookie('admin_token', 'classified_access', { httpOnly: true, secure: true, sameSite: 'none' });
      return res.json({ success: true });
    }
    res.status(401).json({ error: 'Invalid credentials' });
  });

  app.post('/api/auth/logout', (req: express.Request, res: express.Response) => {
    res.clearCookie('admin_token');
    res.json({ success: true });
  });

  app.get('/api/auth/me', (req: express.Request, res: express.Response) => {
    if (req.cookies.admin_token === 'classified_access') {
      return res.json({ success: true });
    }
    res.status(401).json({ error: 'Unauthorized' });
  });

  // 2. Rota Admin (/hq-admin) -> CRUD Sentenças
  app.get('/api/sentences', requireAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const sentences = await prisma.sentence.findMany({ orderBy: { description: 'asc' } });
      res.json(sentences);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/sentences', requireAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const data = sentenceSchema.parse(req.body);
      const sentence = await prisma.sentence.create({ data });
      res.json(sentence);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: (error as z.ZodError).errors });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/sentences/:id', requireAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      const data = sentenceSchema.parse(req.body);
      const sentence = await prisma.sentence.update({ where: { id }, data });
      res.json(sentence);
    } catch (error) {
      res.status(400).json({ error: 'Bad request' });
    }
  });

  app.delete('/api/sentences/:id', requireAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const { id } = req.params;
      // Soft delete? Actually let's do hard delete or soft delete depending on prompt:
      // "Controle de exclusão lógica (soft delete)."
      const sentence = await prisma.sentence.update({ where: { id }, data: { is_active: false } });
      res.json(sentence);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // 3. Rota de Execução (/hq-admin/judgement)
  app.post('/api/judgement', requireAdmin, async (req: express.Request, res: express.Response) => {
    try {
      const { user_id } = judgementSchema.parse(req.body);

      // Idempotency: check if already drawn
      const existing = await prisma.draw.findUnique({
        where: { user_id },
        include: { sentence: true }
      });
      if (existing) {
        return res.json(existing); // Just return existing result
      }

      // Process randomly within transaction
      const activeSentences = await prisma.sentence.findMany({ where: { is_active: true } });
      if (activeSentences.length === 0) {
        return res.status(400).json({ error: 'No active sentences found.' });
      }

      const randomIndex = Math.floor(Math.random() * activeSentences.length);
      const selectedSentence = activeSentences[randomIndex];

      const draw = await prisma.$transaction(async (tx) => {
        return await tx.draw.create({
          data: {
            user_id,
            sentence_id: selectedSentence.id
          },
          include: { sentence: true }
        });
      });

      res.json(draw);
    } catch (error) {
      if (error instanceof z.ZodError) return res.status(400).json({ error: (error as z.ZodError).errors });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.use('/uploads', express.static(path.join(process.cwd(), 'public', 'uploads')));

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
