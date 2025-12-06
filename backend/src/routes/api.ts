import { Router } from 'express';
import { ocrRouter } from './ocr';
import { feedbackRouter } from './feedback';

export const router = Router();

router.use('/ocr', ocrRouter);
router.use('/feedback', feedbackRouter);

// Example endpoint
router.get('/status', (req, res) => {
  res.json({ message: 'API is running' });
});
