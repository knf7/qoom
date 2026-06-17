require('dotenv').config({ path: '../../.env' });
const { execSync } = require('child_process');

console.log('Pushing schema...');
execSync('npx prisma db push', { stdio: 'inherit' });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const result = await prisma.user.updateMany({
    where: { scanCredits: 0 },
    data: { scanCredits: 2 }
  });
  console.log(`Updated ${result.count} existing users to have 2 scans!`);
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect());
