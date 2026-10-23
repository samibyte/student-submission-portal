import bcrypt from "bcryptjs";

import {
  Role,
  UserStatus,
} from "../../../../generated/prisma/enums";
import { prisma } from "../../lib/prisma";
import { jwtUtils } from "../../util/jwt";
import { generateAuthTokens } from "../../util/authToken";
import type { IRegisterStudentPayload } from "./auth.interface";
const registerStudent = async (
  payload: IRegisterStudentPayload,
) => {
  const { name, password } = payload;
  const email = payload.email.trim().toLowerCase();

  const userExists = await prisma.user.findUnique({
    where: { email },
  });

  if (userExists) {
    throw new Error("User with this email already exists");
  }

  const hashedPassword = await bcrypt.hash(password, 8);

  const createdUser = await prisma.user.create({
    data: {
      name,
      email,
      password: hashedPassword,
      role: Role.STUDENT,
      status: UserStatus.ACTIVE,
    },
    omit: { password: true },
  });

  const { ...user } = createdUser;

  const jwtPayload = {
    userId: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  };

  const authTokens = generateAuthTokens(jwtPayload);

  return {
    user,
    ...authTokens,
  };
};
