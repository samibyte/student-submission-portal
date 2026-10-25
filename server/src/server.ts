import "dotenv/config";
import app from "./app.js";
import { envVars } from "./app/config/env.js";
import { prisma } from "./app/lib/prisma.js";

const PORT = Number(envVars.PORT);

const main = async () => {
  try {
    await prisma.$connect();
    console.log("✅ Connected to the database.");
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    await prisma.$disconnect();
    process.exit(1);
  }
};

if (process.env.VERCEL !== "1") {
  void main();
}

export default app;
