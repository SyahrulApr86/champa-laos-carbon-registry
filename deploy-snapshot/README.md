# Deploy snapshot

Point-in-time dump of the local demo deployment, taken 2026-08-09. Restoring
this on a fresh `docker compose up` reproduces the exact current state:
demo accounts, organisations, projects, credits, uploaded documents, and
every manual test record created while writing the documentation.

## Contents

- `carbondev-snapshot.sql` — full `pg_dump` of the `carbondev` Postgres database (schema + data).
- `filestore-snapshot.tar.gz` — contents of the `filestore` volume (uploaded PDD documents, signatures, etc).

## Restoring on a fresh environment

1. Bring up the database only, and let it initialize an empty schema:

   ```sh
   docker compose up -d db
   ```

2. Restore the database dump (drops and recreates objects from the dump, so run this against a fresh/empty database):

   ```sh
   docker exec -i db psql -U root -d carbondev < deploy-snapshot/carbondev-snapshot.sql
   ```

3. Restore the filestore volume:

   ```sh
   docker compose up -d national   # creates the filestore volume if it doesn't exist yet
   docker compose stop national
   docker run --rm -v undp-carbon-registry_filestore:/fs -v "$(pwd)/deploy-snapshot:/in" alpine \
     sh -c "rm -rf /fs/* && tar xzf /in/filestore-snapshot.tar.gz -C /fs"
   ```

4. Start everything:

   ```sh
   docker compose up -d
   ```

Do **not** run the `migrate` service or the demo-seeder (`RUN_MODULE=demo-seeder`) after restoring this snapshot — the dump already contains the fully migrated schema and seeded data. Running migrations again is harmless (idempotent), but running the demo-seeder again will duplicate synthetic records.

## Regenerating this snapshot

From a running deployment whose state you want to freeze:

```sh
docker exec db pg_dump -U root -d carbondev --no-owner --no-privileges > deploy-snapshot/carbondev-snapshot.sql
docker run --rm -v undp-carbon-registry_filestore:/fs -v "$(pwd)/deploy-snapshot:/out" alpine \
  tar czf /out/filestore-snapshot.tar.gz -C /fs .
```
