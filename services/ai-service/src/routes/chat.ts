import { Router, Request, Response, NextFunction } from 'express';
import { generateChatResponse } from '../services/vertex.service';

const router = Router();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequestBody {
  message: string;
  history?: ChatMessage[];
}

router.post('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { message, history = [] } = req.body as ChatRequestBody;
    if (!message || typeof message !== 'string') {
      res.status(400).json({ success: false, error: { code: 'BAD_REQUEST', message: 'message is required' } });
      return;
    }

    const reply = await generateChatResponse(history, message);
    res.json({ success: true, data: { reply } });
  } catch (err) {
    next(err);
  }
});

export { router as chatRouter };
