import { CaptchaService } from "./captcha.service";

describe("CaptchaService", () => {
  const previousTestMode = process.env.CHAMPA_CAPTCHA_TEST_MODE;

  beforeEach(() => {
    process.env.CHAMPA_CAPTCHA_TEST_MODE = "true";
  });

  afterEach(() => {
    if (previousTestMode === undefined) {
      delete process.env.CHAMPA_CAPTCHA_TEST_MODE;
    } else {
      process.env.CHAMPA_CAPTCHA_TEST_MODE = previousTestMode;
    }
    jest.restoreAllMocks();
  });

  it("provides a deterministic, test-only challenge that is consumed once", () => {
    const service = new CaptchaService();
    const challenge = service.generate();

    expect(challenge.svg).toContain("DEMO42");
    expect(challenge.expiresAt).toMatch(/Z$/);
    expect(service.validate(challenge.challengeId, "demo42")).toBe(true);
    expect(service.validate(challenge.challengeId, "demo42")).toBe(false);
  });

  it("rejects an expired challenge without revealing whether it existed", () => {
    const now = jest.spyOn(Date, "now");
    now.mockReturnValue(1_000);
    const service = new CaptchaService();
    const challenge = service.generate();

    now.mockReturnValue(1_000 + 5 * 60 * 1000 + 1);

    expect(service.validate(challenge.challengeId, "demo42")).toBe(false);
  });
});
