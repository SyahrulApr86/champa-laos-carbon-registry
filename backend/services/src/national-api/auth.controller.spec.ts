import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  const authService = {
    login: jest.fn(),
    refreshToken: jest.fn(),
    forgotPassword: jest.fn(),
  };
  const passwordResetService = {
    resetPassword: jest.fn(),
    checkPasswordResetRequestId: jest.fn(),
  };

  const controller = new AuthController(
    authService as any,
    passwordResetService as any
  );

  beforeEach(() => jest.clearAllMocks());

  it("passes the reset request to the auth service without exposing account state", async () => {
    authService.forgotPassword.mockResolvedValue({ statusCode: 200 });

    await expect(
      controller.forgotPassword({ email: "visitor@example.test" } as any, {} as any)
    ).resolves.toEqual({ statusCode: 200 });
    expect(authService.forgotPassword).toHaveBeenCalledWith("visitor@example.test");
  });
});
