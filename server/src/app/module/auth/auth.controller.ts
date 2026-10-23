import { catchAsync } from "../../util/catchAsync";
import { sendResponse } from "../../util/sendResponse";
import httpStatus from "http-status";

const registerStudent = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;

  const result = await authService.registerStudent(payload);

  const { accessToken, refreshToken, user, student } = result;

  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24, // 24 hour or 1 day
  });
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: false,
    sameSite: "none",
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  });

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "Student registered successfully",
    data: {
      accessToken,
      refreshToken,
      user,
      student,
    },
  });
});



export const authController = {
  registerStudent,
};