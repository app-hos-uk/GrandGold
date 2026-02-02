import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { ValidationError } from '@grandgold/utils';
import { ProductQAService } from '../services/qa.service';
import { authenticate, optionalAuth } from '../middleware/auth';

const router = Router();
const qaService = new ProductQAService();

const questionSchema = z.object({ question: z.string().min(10).max(500) });
const answerSchema = z.object({ answer: z.string().min(10).max(1000) });

/**
 * GET /api/products/:productId/qa
 * Get product Q&A
 */
router.get('/:productId/qa', optionalAuth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await qaService.getProductQA(req.params.productId, { page, limit });

    res.json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/products/:productId/qa
 * Add question (authenticated)
 */
router.post('/:productId/qa', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) throw new Error('Not authenticated');

    const { question } = questionSchema.parse(req.body);

    const result = await qaService.addQuestion(
      req.params.productId,
      req.user.sub,
      question,
      (req as any).user?.name
    );

    res.status(201).json({
      success: true,
      data: result,
      message: 'Question submitted',
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      next(new ValidationError('Validation failed', { errors: error.errors }));
    } else {
      next(error);
    }
  }
});

/**
 * POST /api/products/:productId/qa/:questionId/answer
 * Add answer to question
 */
router.post(
  '/:productId/qa/:questionId/answer',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('Not authenticated');

      const { answer } = answerSchema.parse(req.body);

      const result = await qaService.addAnswer(
        req.params.productId,
        req.params.questionId,
        req.user.sub,
        answer,
        { userName: (req as any).user?.name }
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Answer submitted',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        next(new ValidationError('Validation failed', { errors: error.errors }));
      } else {
        next(error);
      }
    }
  }
);

/**
 * POST /api/products/:productId/qa/:questionId/answers/:answerId/helpful
 * Mark answer as helpful
 */
router.post(
  '/:productId/qa/:questionId/answers/:answerId/helpful',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) throw new Error('Not authenticated');

      await qaService.markHelpful(
        req.params.productId,
        req.params.questionId,
        req.params.answerId,
        req.user.sub
      );

      res.json({
        success: true,
        message: 'Marked as helpful',
      });
    } catch (error) {
      next(error);
    }
  }
);

export { router as qaRouter };
