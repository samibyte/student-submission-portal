import dotenv from "dotenv";
import status from "http-status";
import AppError from "../errorHelper/appError.js";

dotenv.config();

interface EnvConfig {
	NODE_ENV: string;
	PORT: string;
	DATABASE_URL: string;
	FRONTEND_URL: string;
	APP_URL: string;
	BCRYPT_SALT_ROUNDS: string;
	ACCESS_TOKEN_SECRET: string;
	REFRESH_TOKEN_SECRET: string;
	ACCESS_TOKEN_EXPIRES_IN: string;
	REFRESH_TOKEN_EXPIRES_IN: string;
	ADMIN_EMAIL: string;
	ADMIN_PASSWORD: string;
}

const loadEnvVariables = (): EnvConfig => {
	const requireEnvVariable = [
		"NODE_ENV",
		"DATABASE_URL",
		"FRONTEND_URL",
		"APP_URL",
		"BCRYPT_SALT_ROUNDS",
		"ACCESS_TOKEN_SECRET",
		"REFRESH_TOKEN_SECRET",
		"ACCESS_TOKEN_EXPIRES_IN",
		"REFRESH_TOKEN_EXPIRES_IN",
	];

	requireEnvVariable.forEach((variable) => {
		if (!process.env[variable]) {
			// throw new Error(`Environment variable ${variable} is required but not set in .env file.`);
			throw new AppError(
				status.INTERNAL_SERVER_ERROR,
				`Environment variable ${variable} is required but not set in .env file.`,
			);
		}
	});

	return {
		NODE_ENV: process.env.NODE_ENV as string,
		PORT: process.env.PORT as string,
		DATABASE_URL: process.env.DATABASE_URL as string,
		FRONTEND_URL: process.env.FRONTEND_URL as string,
		APP_URL: process.env.FRONTEND_URL as string,
		BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS as string,
		ACCESS_TOKEN_SECRET: process.env.ACCESS_TOKEN_SECRET as string,
		REFRESH_TOKEN_SECRET: process.env.REFRESH_TOKEN_SECRET as string,
		ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN as string,
		REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN as string,
		ADMIN_EMAIL: process.env.ADMIN_EMAIL as string,
		ADMIN_PASSWORD: process.env.ADMIN_PASSWORD as string,
	};
};

export const envVars = loadEnvVariables();