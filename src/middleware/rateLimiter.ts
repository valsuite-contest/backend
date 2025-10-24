import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts from this IP, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

export const submissionLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: 'Too many submissions, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

export const clarificationLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  message: 'Too many clarification requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});
