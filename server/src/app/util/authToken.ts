import type { SignOptions } from "jsonwebtoken";

import { jwtUtils } from "./jwt";
import { envVars } from "../config/env";

interface IAuthPayload {
  userId: string;
  name: string;
  email: string;
  role: string;
}

export const generateAuthTokens = (jwtPayload: IAuthPayload) => {
  return {
    accessToken: jwtUtils.createToken(
      jwtPayload,
     envVars.ACCESS_TOKEN_SECRET,
      envVars.ACCESS_TOKEN_EXPIRES_IN as SignOptions,
    ),

    refreshToken: jwtUtils.createToken(
      jwtPayload,
      envVars.REFRESH_TOKEN_SECRET,
      envVars.REFRESH_TOKEN_EXPIRES_IN as SignOptions,
    ),
  };
};