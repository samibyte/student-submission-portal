import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

async function main() {
  const email = process.env.SEED_MENTOR_EMAIL ?? "mentor@example.com";
  const password = process.env.SEED_MENTOR_PASSWORD ?? "Mentor@123";
  const name = "Mentor User";
  const studentEmail = process.env.SEED_STUDENT_EMAIL ?? "student@example.com";
  const studentPassword = process.env.SEED_STUDENT_PASSWORD ?? "Student@123";
  const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 10);

  const hashed = await bcrypt.hash(password, saltRounds);
  const hashedStudentPassword = await bcrypt.hash(studentPassword, saltRounds);

  const mentor = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      name,
      email,
      password: hashed,
      role: "MENTOR",
    },
  });

  const student = await prisma.user.upsert({
    where: { email: studentEmail },
    update: {},
    create: {
      name: "Student User",
      email: studentEmail,
      password: hashedStudentPassword,
      role: "STUDENT",
    },
  });

  console.log(`✅ Seeded mentor: ${mentor.email} (id: ${mentor.id})`);
  console.log(`✅ Seeded student: ${student.email} (id: ${student.id})`);
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
