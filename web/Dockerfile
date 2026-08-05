FROM node:20-alpine AS dependencies

WORKDIR /app
COPY ./web/package.json ./web/yarn.lock ./
RUN apk add python3 make g++ && rm -rf /var/cache/apk/*
RUN CI=false yarn install --frozen-lockfile && yarn cache clean

FROM dependencies AS build

COPY ./web .

ARG PORT
ENV PORT $PORT

ARG VITE_APP_BACKEND
ENV VITE_APP_BACKEND $VITE_APP_BACKEND

ARG VITE_APP_STAT_URL
ENV VITE_APP_STAT_URL $VITE_APP_STAT_URL

ARG VITE_APP_COUNTRY_NAME
ENV VITE_APP_COUNTRY_NAME $VITE_APP_COUNTRY_NAME

ARG VITE_APP_REGISTRY_NAME
ENV VITE_APP_REGISTRY_NAME $VITE_APP_REGISTRY_NAME

ARG VITE_APP_COUNTRY_FLAG_URL
ENV VITE_APP_COUNTRY_FLAG_URL $VITE_APP_COUNTRY_FLAG_URL

ARG VITE_APP_COUNTRY_CODE
ENV VITE_APP_COUNTRY_CODE $VITE_APP_COUNTRY_CODE

ARG VITE_APP_MAPBOXGL_ACCESS_TOKEN
ENV VITE_APP_MAPBOXGL_ACCESS_TOKEN $VITE_APP_MAPBOXGL_ACCESS_TOKEN

ARG VITE_APP_MAP_TYPE
ENV VITE_APP_MAP_TYPE $VITE_APP_MAP_TYPE

ARG VITE_APP_ENABLE_REGISTRATION
ENV VITE_APP_ENABLE_REGISTRATION $VITE_APP_ENABLE_REGISTRATION

# Build the app
RUN CI=false yarn build

# production environment
FROM nginx:stable-alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY ./web/docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh
COPY ./web/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE $PORT
CMD ["nginx", "-g", "daemon off;"]
