import "reflect-metadata";
import { DataSource } from "typeorm";

// Standalone TypeORM CLI DataSource, used only by `yarn migration:*` scripts
// (package.json). The running NestJS app still boots via
// libs/core/src/app-config/configuration.ts + autoLoadEntities/synchronize -
// this file exists solely so schema changes can also ship as reviewable,
// explicit migrations instead of relying on synchronize in environments
// where that's disabled.
export const AppDataSource = new DataSource({
  type: "postgres",
  host: process.env.DB_HOST || "localhost",
  port: parseInt(process.env.DB_PORT) || 5432,
  username: process.env.DB_USER || "hquser",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "carbondev",
  entities: [__dirname + "/entities/*.entity{.ts,.js}"],
  migrations: [__dirname + "/migrations/*{.ts,.js}"],
  synchronize: false,
});
