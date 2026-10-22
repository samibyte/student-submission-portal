import "dotenv/config";
import app from "./app.js";
import { envVars } from "./app/config/env.js";
import { prisma } from "./app/lib/prisma.js";
import type { NextFunction, Request, Response } from "express";

const PORT = Number(envVars.PORT);

const isServerless = process.env.VERCEL === "1";

let bootstrapPromise: Promise<void> | null = null;

const bootstrap = async () => {
	if (bootstrapPromise) return bootstrapPromise;

	const pendingBootstrap = (async () => {
		await prisma.$connect();
	})();

	bootstrapPromise = pendingBootstrap.catch((error) => {
		bootstrapPromise = null;
		throw error;
	});

	return bootstrapPromise;
};

// Ensure DB/Redis/SMTP connections are established on every request. This is
// safe on serverless cold starts where module-level connections may drop.
app.use(async (_req: Request, _res: Response, next: NextFunction) => {
	try {
		await bootstrap();
		next();
	} catch (error) {
		next(error);
	}
});

export default app;

// For non-serverless environments (e.g. local `node dist/server.js`).
if (!isServerless) {
	const main = async () => {
		try {
			await bootstrap();
			console.log("Connected to the database successfully.");
			app.listen(PORT, () => {
				console.log(`Server is running on port ${PORT}`);
			});
		} catch (error) {
			console.error("Error starting the server:", error);
			await prisma.$disconnect();
			process.exit(1);
		}
	};

	main();
}