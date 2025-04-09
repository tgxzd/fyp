import { PrismaClient } from '@prisma/client';

// Prevent multiple instances of Prisma Client in development
declare global {
  var prisma: PrismaClient | undefined;
}

// Initialize Prisma client globally (for development) or locally (for production)
export const prisma = global.prisma || new PrismaClient();

// For development, attach to global so it persists across hot reloads
if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

// Export as default and named export for flexibility
export default prisma; 