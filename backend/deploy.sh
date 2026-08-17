#!/usr/bin/env bash
#
# Energy Tail — deployment script
#
# Run from the backend directory on the server:
#   bash deploy.sh
#
# Safe to re-run. Put the site in maintenance mode first for a zero-surprise
# deploy; the script does that itself and lifts it at the end even if a step
# fails part way through.

set -euo pipefail

echo "==> Energy Tail deployment"

if [ ! -f artisan ]; then
    echo "ERROR: run this from the Laravel backend directory (no artisan file here)." >&2
    exit 1
fi

if [ ! -f .env ]; then
    echo "ERROR: no .env file. Copy .env.production.example to .env and fill it in." >&2
    exit 1
fi

# Lift maintenance mode however the script exits, so a failure never leaves
# the site dark.
cleanup() {
    php artisan up >/dev/null 2>&1 || true
}
trap cleanup EXIT

echo "==> Enabling maintenance mode"
php artisan down --retry=60 || true

echo "==> Installing dependencies"
# --no-dev omits test and analysis tooling; the optimised autoloader avoids a
# filesystem lookup on every class load.
composer install --no-dev --optimize-autoloader --no-interaction --prefer-dist

echo "==> Running migrations"
# --force is required because Laravel refuses to migrate in production
# without an explicit confirmation.
php artisan migrate --force

echo "==> Seeding reference data"
# Roles, permissions, settings and taxonomy are production data the client
# edits, and every seeder here is idempotent. DemoDataSeeder is skipped
# automatically in production — see DatabaseSeeder.
php artisan db:seed --class=RolePermissionSeeder --force
php artisan db:seed --class=SettingSeeder --force
php artisan db:seed --class=TaxonomySeeder --force

echo "==> Linking storage"
# Makes uploaded logos and images reachable under /storage.
php artisan storage:link || true

echo "==> Caching configuration"
php artisan config:cache
php artisan route:cache
php artisan event:cache

echo "==> Restarting queue workers"
# Workers hold code in memory, so without this they keep running the old
# release until they happen to restart.
php artisan queue:restart || true

echo "==> Verifying"
php artisan about --only=environment

echo ""
echo "Deployment complete."
echo "Check: curl -s https://api.energytail.com/api/v1/health"
