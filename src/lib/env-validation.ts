/**
 * Environment variable validation
 * Called on app startup to validate required configuration
 */

interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Required: Firebase credentials (one of two formats)
  const hasFirebaseCredentials =
    !!process.env.FIREBASE_CREDENTIALS_BASE64 || !!process.env.FIREBASE_SERVICE_ACCOUNT;

  if (!hasFirebaseCredentials) {
    errors.push(
      'Missing Firebase credentials: Set either FIREBASE_CREDENTIALS_BASE64 or FIREBASE_SERVICE_ACCOUNT'
    );
  }

  // Required: JWT_SECRET
  if (!process.env.JWT_SECRET) {
    errors.push('Missing JWT_SECRET environment variable (required, min 32 chars)');
  } else if (process.env.JWT_SECRET.length < 32) {
    errors.push('JWT_SECRET must be at least 32 characters long');
  }

  // Optional with warnings
  if (!process.env.RESEND_API_KEY || process.env.RESEND_API_KEY === 'your_resend_api_key') {
    warnings.push(
      'RESEND_API_KEY not configured — emails will be logged to console instead of sent'
    );
  }

  if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET) {
    warnings.push(
      'GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not configured — Google Calendar integration disabled'
    );
  }

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push(
      'NEXT_PUBLIC_APP_URL not set — defaulting to https://yd-dashboard.vercel.app for email links'
    );
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Log environment validation results on startup
 */
export function logEnvironmentValidation(): void {
  const result = validateEnvironment();

  if (result.warnings.length > 0) {
    console.warn('⚠️  Environment warnings:');
    result.warnings.forEach((w) => console.warn(`   - ${w}`));
  }

  if (!result.valid) {
    console.error('❌ Environment validation failed:');
    result.errors.forEach((e) => console.error(`   - ${e}`));
    
    if (process.env.NODE_ENV === 'production') {
      throw new Error(
        `Environment validation failed: ${result.errors.join('; ')}`
      );
    }
  } else {
    console.log('✅ Environment validation passed');
  }
}
