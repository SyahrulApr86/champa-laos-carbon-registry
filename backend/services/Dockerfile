FROM node:20-alpine AS dependencies

WORKDIR /app/backend/services
COPY ./backend/services/package.json ./backend/services/yarn.lock ./
RUN yarn install --frozen-lockfile && yarn cache clean

FROM dependencies AS build

COPY ./backend/services ./
RUN yarn build

# This target deliberately retains TypeScript tooling and source files so
# `docker compose run --rm migrate` can execute TypeORM migrations before the
# application services start. It is never used as the application runtime.
FROM build AS migration

FROM node:20-alpine AS runtime

WORKDIR /app/backend/services
ENV NODE_ENV=production

COPY ./backend/services/package.json ./backend/services/yarn.lock ./
RUN yarn install --production=true --frozen-lockfile && yarn cache clean

COPY --from=build /app/backend/services/dist ./dist
COPY --from=build /app/backend/services/public ./public
COPY --from=build /app/backend/services/*.csv ./
COPY --from=build /app/backend/services/countries.json ./
COPY --from=build /app/backend/services/response.json ./
COPY --from=build /app/backend/services/fonts ./fonts
COPY --from=build /app/backend/services/images ./images

CMD ["node", "dist/main.js"]
