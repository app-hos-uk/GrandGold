import { generateId, NotFoundError, ValidationError } from '@grandgold/utils';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
const QA_PREFIX = 'product_qa:';
const TTL = 60 * 60 * 24 * 365; // 1 year

export interface Question {
  id: string;
  productId: string;
  userId: string;
  question: string;
  userName?: string;
  createdAt: string;
  answers: Answer[];
}

export interface Answer {
  id: string;
  questionId: string;
  userId: string;
  userName?: string;
  answer: string;
  isSeller: boolean;
  createdAt: string;
  helpfulCount: number;
}

export class ProductQAService {
  /**
   * Add question to product
   */
  async addQuestion(
    productId: string,
    userId: string,
    question: string,
    userName?: string
  ): Promise<Question> {
    const id = generateId('q');
    const q: Question = {
      id,
      productId,
      userId,
      question,
      userName: userName || 'Anonymous',
      createdAt: new Date().toISOString(),
      answers: [],
    };

    const key = `${QA_PREFIX}${productId}`;
    const existing = await redis.get(key);
    const questions: Question[] = existing ? JSON.parse(existing) : [];
    questions.push(q);
    await redis.setex(key, TTL, JSON.stringify(questions));

    return q;
  }

  /**
   * Add answer to question
   */
  async addAnswer(
    productId: string,
    questionId: string,
    userId: string,
    answer: string,
    options?: { userName?: string; isSeller?: boolean }
  ): Promise<Answer> {
    const key = `${QA_PREFIX}${productId}`;
    const data = await redis.get(key);
    if (!data) throw new NotFoundError('Question');

    const questions: Question[] = JSON.parse(data);
    const question = questions.find((q) => q.id === questionId);
    if (!question) throw new NotFoundError('Question');

    const answerId = generateId('a');
    const ans: Answer = {
      id: answerId,
      questionId,
      userId,
      userName: options?.userName || 'GrandGold User',
      answer,
      isSeller: options?.isSeller || false,
      createdAt: new Date().toISOString(),
      helpfulCount: 0,
    };

    question.answers.push(ans);
    await redis.setex(key, TTL, JSON.stringify(questions));

    return ans;
  }

  /**
   * Get Q&A for product
   */
  async getProductQA(
    productId: string,
    options?: { page?: number; limit?: number }
  ): Promise<{ data: Question[]; total: number }> {
    const key = `${QA_PREFIX}${productId}`;
    const data = await redis.get(key);
    const questions: Question[] = data ? JSON.parse(data) : [];

    const page = options?.page || 1;
    const limit = options?.limit || 10;
    const start = (page - 1) * limit;
    const paginated = questions.slice(start, start + limit);

    return { data: paginated, total: questions.length };
  }

  /**
   * Mark answer as helpful
   */
  async markHelpful(productId: string, questionId: string, answerId: string, userId: string): Promise<void> {
    const key = `${QA_PREFIX}${productId}`;
    const data = await redis.get(key);
    if (!data) throw new NotFoundError('Question');

    const questions: Question[] = JSON.parse(data);
    const question = questions.find((q) => q.id === questionId);
    const answer = question?.answers.find((a) => a.id === answerId);
    if (!answer) throw new NotFoundError('Answer');

    (answer as any).helpfulBy = (answer as any).helpfulBy || [];
    if ((answer as any).helpfulBy.includes(userId)) {
      throw new ValidationError('Already marked as helpful');
    }
    (answer as any).helpfulBy.push(userId);
    answer.helpfulCount = (answer as any).helpfulBy.length;

    await redis.setex(key, TTL, JSON.stringify(questions));
  }
}
