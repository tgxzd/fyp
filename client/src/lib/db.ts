import { prisma } from '@/lib/prisma'

// User-related database functions
export async function getUserById(id: string) {
  try {
    return await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        // Don't select password for security
      },
    });
  } catch (error) {
    console.error('Error fetching user by ID:', error);
    return null;
  }
}

export async function getUserByEmail(email: string) {
  try {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true, // Include password for auth
      },
    });
  } catch (error) {
    console.error('Error fetching user by email:', error);
    return null;
  }
}

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
}) {
  try {
    return await prisma.user.create({
      data,
      select: {
        id: true,
        name: true,
        email: true,
        // Don't select password for security
      },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    throw error; // Rethrow to handle in the calling function
  }
}

export async function updateUser(
  id: string,
  data: Partial<{
    name: string;
    email: string;
    password: string;
  }>
) {
  try {
    return await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        // Don't select password for security
      },
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return null;
  }
}

// Example function for a different model if you extend your schema
// export async function getPosts() {
//   try {
//     return await prisma.post.findMany({
//       include: {
//         author: {
//           select: {
//             id: true,
//             name: true,
//           },
//         },
//       },
//     });
//   } catch (error) {
//     console.error('Error fetching posts:', error);
//     return [];
//   }
// }

// Utility to safely handle Prisma connection in serverless environments
export async function withPrisma<T>(
  fn: (prisma: typeof import('@prisma/client')['PrismaClient']) => Promise<T>
): Promise<T> {
  try {
    return await fn(prisma);
  } catch (error) {
    console.error('Database operation failed:', error);
    throw error;
  } finally {
    // No need to disconnect in Next.js app with a singleton
    // Only use disconnect if working in a serverless environment
    // await prisma.$disconnect();
  }
} 