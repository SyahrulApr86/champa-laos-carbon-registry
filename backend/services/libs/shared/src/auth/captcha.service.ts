import { Injectable, Logger } from "@nestjs/common";
import { randomUUID } from "crypto";
import * as svgCaptcha from "svg-captcha";

interface CaptchaChallenge {
  text: string;
  expiresAt: number;
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

  generate(): { challengeId: string; svg: string } {
    this.evictExpired();

    const captcha = svgCaptcha.create({
      size: 6,
      noise: 3,
      color: true,
      width: 200,
      height: 80,
      background: "#f0f2f5",
    });

    const challengeId = randomUUID();
    this.challenges.set(challengeId, {
      text: captcha.text.trim().toLowerCase(),
      expiresAt: Date.now() + this.ttlMs,
    });

    return { challengeId, svg: captcha.data };
  }

  /**
   * Validates and consumes (single-use) a captcha challenge. Returns false
   * for a missing, expired, or mismatched answer without leaking which.
   */
  validate(challengeId: string, text: string): boolean {
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
