export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { logEnvironmentValidation } = await import('./lib/env-validation');
    logEnvironmentValidation();
  }
}
