import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkInterviews() {
  const interviews = await prisma.interview.findMany({ take: 5 });
  console.log("Sample Interview IDs:");
  interviews.forEach(i => console.log(`${i.id} - ${i.type}`));
  await prisma.$disconnect();
}

checkInterviews();
