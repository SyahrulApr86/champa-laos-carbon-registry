import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  const captchaService = {
    generate: jest.fn(),
  };
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
    passwordResetService as any,
    captchaService as any,
    {} as any
  );

  beforeEach(() => jest.clearAllMocks());

  it("returns only an ephemeral captcha challenge", async () => {
    captchaService.generate.mockReturnValue({
      challengeId: "challenge-id",
      svg: "<svg />",
      expiresAt: "2026-08-05T00:05:00.000Z",
    });

    await expect(controller.getCaptcha()).resolves.toEqual({
      challengeId: "challenge-id",
      svg: "<svg />",
      expiresAt: "2026-08-05T00:05:00.000Z",
    });
  });

  it("passes the reset request to the auth service without exposing account state", async () => {
    authService.forgotPassword.mockResolvedValue({ statusCode: 200 });

    await expect(
      controller.forgotPassword({ email: "visitor@example.test" } as any, {} as any)
    ).resolves.toEqual({ statusCode: 200 });
    expect(authService.forgotPassword).toHaveBeenCalledWith("visitor@example.test");
  });
});
