#!/usr/bin/env sh

set -eu

if [ "${1:-}" = "--seed-demo" ]; then
  seed_demo=true
elif [ "${1:-}" = "" ]; then
  seed_demo=false
else
  echo "Usage: scripts/deploy.sh [--seed-demo]" >&2
  exit 2
fi

docker compose build
docker compose up -d db
docker compose --profile tools run --rm migrate
docker compose up -d --force-recreate national stats replicator web

if [ "$seed_demo" = true ]; then
  docker compose run --rm \
    -e RUN_MODULE=demo-seeder \
    -e NODE_ENV=development \
    -e CHAMPA_DEMO_DATABASE=true \
    -e CHAMPA_DEMO_SEED_MODE=replace \
    -e CHAMPA_DEMO_SEED_CONFIRMATION=I_UNDERSTAND_THIS_WRITES_SYNTHETIC_DEMO_DATA \
    national
  docker compose restart national stats replicator
fi

docker compose ps
