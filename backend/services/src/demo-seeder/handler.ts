import { NestFactory } from "@nestjs/core";
import { getLogger } from "../server";
import { DemoSeederModule } from "./demo-seeder.module";
import { DemoSeederService } from "./demo-seeder.service";

// Standalone entry point, same pattern as src/data-importer/handler.ts:
// boots the Nest DI container (real DB connection, real service layer,
// no HTTP listener) and calls the seeder directly. Bypasses the public
// HTTP API entirely, which is correct
// here - this is an operator-run maintenance task, not a user-facing flow.
export const handler = async () => {
  const app = await NestFactory.createApplicationContext(DemoSeederModule, {
    logger: getLogger(DemoSeederModule),
  });
  await app.get(DemoSeederService).run();
  await app.close();
};
