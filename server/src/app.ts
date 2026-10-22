import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
	type Application,
	type Request,
	type Response,
} from "express";
import helmet from "helmet";
import httpStatus from "http-status";
import { envVars } from "./app/config/env.js";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler.js";
import { notFound } from "./app/middleware/notFound.js";

const app: Application = express();

app.use(helmet());

app.use(
	cors({
		origin: envVars.FRONTEND_URL,
		credentials: true,
	}),
);

// Enable URL-encoded form data parsing
app.use(express.urlencoded({ extended: true }));



// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());


// Basic route
app.get("/", async (_req: Request, res: Response) => {
	res.status(httpStatus.OK).json({
		success: true,
		message: "Students Portal - System running",
	});
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;