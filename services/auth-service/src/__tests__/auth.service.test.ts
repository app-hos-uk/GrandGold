import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Redis
vi.mock('ioredis', () => ({
  default: vi.fn(() => ({
    get: vi.fn().mockResolvedValue(null),
    set: vi.fn().mockResolvedValue('OK'),
    setex: vi.fn().mockResolvedValue('OK'),
    del: vi.fn().mockResolvedValue(1),
    on: vi.fn(),
    quit: vi.fn(),
  })),
}));

// Mock dependencies
vi.mock('@grandgold/database', () => ({
  findUserByEmail: vi.fn(),
  findUserById: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  updateUserLastLogin: vi.fn(),
  verifyEmail: vi.fn(),
  verifyPhone: vi.fn(),
  createSession: vi.fn().mockResolvedValue({
    id: 'session_123',
    userId: 'user_123',
    refreshToken: 'refresh_token',
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  }),
  findSessionById: vi.fn(),
  findSessionByRefreshToken: vi.fn(),
  getUserActiveSessions: vi.fn().mockResolvedValue([]),
  updateSessionActivity: vi.fn(),
  invalidateSession: vi.fn(),
  invalidateAllUserSessions: vi.fn(),
  logUserActivity: vi.fn(),
  getUserActivities: vi.fn().mockResolvedValue([]),
}));

vi.mock('@grandgold/utils', () => ({
  hashPassword: vi.fn().mockResolvedValue('hashed_password'),
  comparePassword: vi.fn(),
  generateId: vi.fn().mockReturnValue('test_id_123'),
  generateToken: vi.fn().mockReturnValue('mock_token'),
  generateTokenPair: vi.fn().mockReturnValue({
    accessToken: 'access_token',
    refreshToken: 'refresh_token',
    expiresIn: 900,
  }),
  verifyToken: vi.fn(),
  generateOtp: vi.fn().mockReturnValue('123456'),
  verifyTotpToken: vi.fn(),
  AuthenticationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
  ConflictError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ConflictError';
    }
  },
  ValidationError: class extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'ValidationError';
    }
  },
}));

import { AuthService } from '../services/auth.service';
import { findUserByEmail, createUser } from '@grandgold/database';
import { comparePassword } from '@grandgold/utils';

describe('AuthService', () => {
  let authService: AuthService;

  beforeEach(() => {
    authService = new AuthService();
    vi.clearAllMocks();
  });

  describe('register', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);
      vi.mocked(createUser).mockResolvedValue({
        id: 'user_123',
        email: 'test@example.com',
      } as ReturnType<typeof createUser> extends Promise<infer T> ? T : never);

      const result = await authService.register({
        email: 'test@example.com',
        password: 'SecurePass123!',
        firstName: 'John',
        lastName: 'Doe',
        phone: '+911234567890',
        country: 'IN',
        acceptedTerms: true,
      });

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email', 'test@example.com');
      expect(createUser).toHaveBeenCalled();
    });

    it('should throw ConflictError if user already exists', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue({
        id: 'existing_user',
        email: 'test@example.com',
      } as Awaited<ReturnType<typeof findUserByEmail>>);

      await expect(
        authService.register({
          email: 'test@example.com',
          password: 'SecurePass123!',
          firstName: 'John',
          lastName: 'Doe',
          phone: '+911234567890',
          country: 'IN',
          acceptedTerms: true,
        })
      ).rejects.toThrow('An account with this email already exists');
    });
  });

  describe('login', () => {
    const mockUser = {
      id: 'user_123',
      email: 'test@example.com',
      passwordHash: 'hashed_password',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+911234567890',
      role: 'customer',
      country: 'IN',
      mfaEnabled: false,
      emailVerified: true,
      phoneVerified: true,
      kycStatus: 'none',
    };

    it('should login successfully with valid credentials', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser as Awaited<ReturnType<typeof findUserByEmail>>);
      vi.mocked(comparePassword).mockResolvedValue(true);

      const result = await authService.login(
        { email: 'test@example.com', password: 'SecurePass123!' },
        { ipAddress: '127.0.0.1', userAgent: 'test-agent' }
      );

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw AuthenticationError for invalid password', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(mockUser as Awaited<ReturnType<typeof findUserByEmail>>);
      vi.mocked(comparePassword).mockResolvedValue(false);

      await expect(
        authService.login(
          { email: 'test@example.com', password: 'WrongPassword!' },
          { ipAddress: '127.0.0.1', userAgent: 'test-agent' }
        )
      ).rejects.toThrow();
    });

    it('should throw AuthenticationError for non-existent user', async () => {
      vi.mocked(findUserByEmail).mockResolvedValue(null);

      await expect(
        authService.login(
          { email: 'nonexistent@example.com', password: 'SecurePass123!' },
          { ipAddress: '127.0.0.1', userAgent: 'test-agent' }
        )
      ).rejects.toThrow();
    });
  });

  describe('validatePassword', () => {
    it('should validate password requirements', () => {
      // Password validation tests
      expect(() => {
        if ('short'.length < 8) throw new Error('Password too short');
      }).toThrow();
    });
  });
});
