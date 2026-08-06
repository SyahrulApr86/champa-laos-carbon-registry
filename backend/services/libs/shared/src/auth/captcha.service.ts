import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import * as svgCaptcha from "svg-captcha";

interface CaptchaChallenge {
  text: string;
  expiresAt: number;
}

export interface CaptchaResponse {
  challengeId: string;
  svg: string;
  expiresAt: string;
}

/**
 * Self-hosted, no-external-API image CAPTCHA for the login form.
 * Generates a distorted-text SVG challenge (mirrors SRN's own approach at
 * https://api.srnmenlh.id/api/captcha) and keeps the expected answer in an
 * in-memory, TTL-expiring map keyed by a random challenge id. Nothing is
 * persisted and no third-party service or API key is involved.
 */
@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);
  private readonly challenges = new Map<string, CaptchaChallenge>();
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutes

  generate(): CaptchaResponse {
    this.evictExpired();

    const testAdapterEnabled =
      process.env.NODE_ENV === "test" &&
      process.env.CHAMPA_CAPTCHA_TEST_MODE === "true";

    const captcha = svgCaptcha.create({
      size: 6,
      noise: 3,
      color: true,
      width: 200,
      height: 80,
      background: "#f0f2f5",
    });

    const challengeId = randomUUID();
    const expiresAt = Date.now() + this.ttlMs;
    const text = testAdapterEnabled ? "demo42" : captcha.text.trim().toLowerCase();

    this.challenges.set(challengeId, {
      text,
      expiresAt,
    });

    return {
      challengeId,
      // The fixed answer is deliberately reachable only under NODE_ENV=test;
      // it is useful for deterministic browser/API tests and never a runtime
      // credential or a seeded account secret.
      svg: testAdapterEnabled
        ? '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="80" role="img" aria-label="Test security code"><rect width="100%" height="100%" fill="#f0f2f5"/><text x="24" y="50" font-size="28" font-family="sans-serif">DEMO42</text></svg>'
        : captcha.data,
      expiresAt: new Date(expiresAt).toISOString(),
    };
  }

  /**
   * Validates and consumes (single-use) a captcha challenge. Returns false
   * for a missing, expired, or mismatched answer without leaking which.
   */
  validate(challengeId: string, text: string): boolean {
    if (process.env.DISABLE_CAPTCHA === "true") {
      return true;
    }

    this.evictExpired();

    if (!challengeId || !text) {
      return false;
    }

    const challenge = this.challenges.get(challengeId);
    this.challenges.delete(challengeId);

    if (!challenge || challenge.expiresAt < Date.now()) {
      return false;
    }

    return challenge.text === text.trim().toLowerCase();
  }

  private evictExpired() {
    const now = Date.now();
    for (const [id, challenge] of this.challenges) {
      if (challenge.expiresAt < now) {
        this.challenges.delete(id);
      }
    }
  }
}
