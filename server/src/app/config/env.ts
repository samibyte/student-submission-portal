import "dotenv/config";
import AppError from "../errorHelper/appError.js";
import httpStatus from "http-status";

interface EnvConfig {
  NODE_ENV: string;
  PORT: string;
  DATABASE_URL: string;
  FRONTEND_URL: string;
  BCRYPT_SALT_ROUNDS: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  SEED_MENTOR_EMAIL: string;
  SEED_MENTOR_PASSWORD: string;
}

const loadEnvVariables = (): EnvConfig => {
  const required = [
    "NODE_ENV",
    "DATABASE_URL",
    "FRONTEND_URL",
    "BCRYPT_SALT_ROUNDS",
    "JWT_SECRET",
    "JWT_EXPIRES_IN",
  ];

  for (const variable of required) {
    if (!process.env[variable]) {
      throw new AppError(
        httpStatus.INTERNAL_SERVER_ERROR,
        `Environment variable ${variable} is required but not set.`,
      );
    }
  }

  return {
    NODE_ENV: process.env.NODE_ENV as string,
    PORT: process.env.PORT ?? "5000",
    DATABASE_URL: process.env.DATABASE_URL as string,
    FRONTEND_URL: process.env.FRONTEND_URL as string,
    BCRYPT_SALT_ROUNDS: process.env.BCRYPT_SALT_ROUNDS as string,
    JWT_SECRET: process.env.JWT_SECRET as string,
    JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN as string,
    SEED_MENTOR_EMAIL: process.env.SEED_MENTOR_EMAIL ?? "mentor@example.com",
    SEED_MENTOR_PASSWORD: process.env.SEED_MENTOR_PASSWORD ?? "Mentor@123",
  };
};

export const envVars = loadEnvVariables();
