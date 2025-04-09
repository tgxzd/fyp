const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('Connected to the database successfully!');
    
    // You can run other initialization tasks here if needed
    
  } catch (error) {
    console.error('Error connecting to the database:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main(); 