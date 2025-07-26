export const config = {
  app: {
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://onco.bot',
  },
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
} as const;

// Helper function to get the base URL for the current environment
export function getBaseUrl() {
  if (typeof window !== 'undefined') {
    // Browser should use relative path
    return '';
  }
  
  if (process.env.VERCEL_URL) {
    // Reference for vercel.com deployments
    return `https://${process.env.VERCEL_URL}`;
  }
  
  if (config.isProduction && config.app.url) {
    // Production environment with configured URL
    return config.app.url;
  }
  
  // Assume localhost
  return 'http://localhost:3000';
}

// Helper function to get the app URL (with fallback for development)
export function getAppUrl() {
  if (config.isDevelopment) {
    return 'http://localhost:3000';
  }
  return config.app.url;
}