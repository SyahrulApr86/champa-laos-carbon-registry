import { CanActivate, ExecutionContext, HttpException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { RateLimiterMemory } from "rate-limiter-flexible";

/**
 * Small in-memory guard for unauthenticated auth endpoints. Deployment may
 * override the values, while safe defaults keep the public demo from accepting
 * unlimited password/reset attempts. A distributed production deployment
 * should replace this with a shared limiter through its infrastructure config.
 */
@Injectable()
export class AuthRateLimiterGuard implements CanActivate {
  private readonly rateLimiter: RateLimiterMemory;

  constructor(configService: ConfigService) {
    const points = Number(configService.get<string>("rateLimiter.auth.limit")) || 10;
    const duration = Number(configService.get<string>("rateLimiter.auth.duration")) || 60;

    this.rateLimiter = new RateLimiterMemory({
      points,
      duration,
      keyPrefix: "auth-rate-limit",
    });
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const key = request.ip || request.socket?.remoteAddress || "unknown";

    try {
      await this.rateLimiter.consume(key);
      return true;
    } catch {
      throw new HttpException(
        {
          statusCode: 429,
          message: "Too many authentication requests. Please try again later.",
        },
        429
      );
    }
  }
}
