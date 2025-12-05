import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkUsers() {
  const users = await prisma.user.findMany();
  console.log("Users in database:", users.length);
  users.forEach(u => console.log(`- ${u.email} (${u.clerkId})`));
  await prisma.$disconnect();
}

checkUsers();
