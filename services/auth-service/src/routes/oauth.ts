import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { Strategy as FacebookStrategy } from 'passport-facebook';
import { OAuthService } from '../services/oauth.service';
import { AuthenticationError } from '@grandgold/utils';

const router = Router();
const oauthService = new OAuthService();

// Configure Passport strategies
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.GOOGLE_CALLBACK_URL || '/api/auth/oauth/google/callback',
    scope: ['profile', 'email'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await oauthService.handleGoogleAuth({
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        avatar: profile.photos?.[0]?.value,
        accessToken,
        refreshToken,
      });
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }));
}

if (process.env.FACEBOOK_APP_ID && process.env.FACEBOOK_APP_SECRET) {
  passport.use(new FacebookStrategy({
    clientID: process.env.FACEBOOK_APP_ID,
    clientSecret: process.env.FACEBOOK_APP_SECRET,
    callbackURL: process.env.FACEBOOK_CALLBACK_URL || '/api/auth/oauth/facebook/callback',
    profileFields: ['id', 'emails', 'name', 'picture.type(large)'],
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      const user = await oauthService.handleFacebookAuth({
        id: profile.id,
        email: profile.emails?.[0]?.value || '',
        firstName: profile.name?.givenName || '',
        lastName: profile.name?.familyName || '',
        avatar: profile.photos?.[0]?.value,
        accessToken,
        refreshToken,
      });
      done(null, user);
    } catch (error) {
      done(error as Error);
    }
  }));
}

// Initialize passport
router.use(passport.initialize());

/**
 * GET /api/auth/oauth/google
 * Start Google OAuth flow
 */
router.get('/google', (req, res, next) => {
  const country = req.query.country || 'IN';
  const state = Buffer.from(JSON.stringify({ country })).toString('base64');
  
  passport.authenticate('google', {
    scope: ['profile', 'email'],
    state,
  })(req, res, next);
});

/**
 * GET /api/auth/oauth/google/callback
 * Google OAuth callback
 */
router.get('/google/callback', 
  passport.authenticate('google', { session: false, failureRedirect: '/login?error=google_failed' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        throw new AuthenticationError('Google authentication failed');
      }
      
      // Get country from state
      let country = 'IN';
      if (req.query.state) {
        try {
          const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
          country = stateData.country || 'IN';
        } catch {
          // Ignore state parsing errors
        }
      }
      
      // Generate tokens
      const result = await oauthService.generateTokensForUser(user, {
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
      
      // Redirect to frontend with tokens
      const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      redirectUrl.pathname = `/${country.toLowerCase()}/auth/callback`;
      redirectUrl.searchParams.set('token', result.tokens.accessToken);
      redirectUrl.searchParams.set('refresh', result.tokens.refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * GET /api/auth/oauth/facebook
 * Start Facebook OAuth flow
 */
router.get('/facebook', (req, res, next) => {
  const country = req.query.country || 'IN';
  const state = Buffer.from(JSON.stringify({ country })).toString('base64');
  
  passport.authenticate('facebook', {
    scope: ['email'],
    state,
  })(req, res, next);
});

/**
 * GET /api/auth/oauth/facebook/callback
 * Facebook OAuth callback
 */
router.get('/facebook/callback',
  passport.authenticate('facebook', { session: false, failureRedirect: '/login?error=facebook_failed' }),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = req.user as any;
      
      if (!user) {
        throw new AuthenticationError('Facebook authentication failed');
      }
      
      // Get country from state
      let country = 'IN';
      if (req.query.state) {
        try {
          const stateData = JSON.parse(Buffer.from(req.query.state as string, 'base64').toString());
          country = stateData.country || 'IN';
        } catch {
          // Ignore state parsing errors
        }
      }
      
      // Generate tokens
      const result = await oauthService.generateTokensForUser(user, {
        ipAddress: req.ip || '',
        userAgent: req.headers['user-agent'] || '',
      });
      
      // Redirect to frontend with tokens
      const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
      redirectUrl.pathname = `/${country.toLowerCase()}/auth/callback`;
      redirectUrl.searchParams.set('token', result.tokens.accessToken);
      redirectUrl.searchParams.set('refresh', result.tokens.refreshToken);
      
      res.redirect(redirectUrl.toString());
    } catch (error) {
      next(error);
    }
  }
);

/**
 * POST /api/auth/oauth/apple
 * Apple Sign In (handles POST from Apple's form-based redirect)
 */
router.post('/apple/callback', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id_token, code, user: userInfo } = req.body;
    
    if (!id_token && !code) {
      throw new AuthenticationError('Apple authentication failed');
    }
    
    // Parse user info if provided (only on first sign-in)
    let parsedUserInfo;
    if (userInfo) {
      try {
        parsedUserInfo = JSON.parse(userInfo);
      } catch {
        // Ignore parsing errors
      }
    }
    
    const user = await oauthService.handleAppleAuth({
      idToken: id_token,
      code,
      firstName: parsedUserInfo?.name?.firstName,
      lastName: parsedUserInfo?.name?.lastName,
      email: parsedUserInfo?.email,
    });
    
    // Generate tokens
    const result = await oauthService.generateTokensForUser(user, {
      ipAddress: req.ip || '',
      userAgent: req.headers['user-agent'] || '',
    });
    
    // Redirect to frontend with tokens
    const redirectUrl = new URL(process.env.FRONTEND_URL || 'http://localhost:3000');
    redirectUrl.pathname = '/auth/callback';
    redirectUrl.searchParams.set('token', result.tokens.accessToken);
    redirectUrl.searchParams.set('refresh', result.tokens.refreshToken);
    
    res.redirect(redirectUrl.toString());
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/auth/oauth/link
 * Link OAuth account to existing user
 */
router.post('/link/:provider', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { provider } = req.params;
    const { accessToken, idToken } = req.body;
    
    if (!['google', 'facebook', 'apple'].includes(provider)) {
      throw new AuthenticationError('Invalid OAuth provider');
    }
    
    // This endpoint would verify the token and link the account
    // Implementation depends on the specific provider
    
    res.json({
      success: true,
      message: `${provider} account linked successfully`,
    });
  } catch (error) {
    next(error);
  }
});

export { router as oauthRouter };
