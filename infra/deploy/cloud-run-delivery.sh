#!/usr/bin/env bash

set -euo pipefail

PROJECT_ID="${PROJECT_ID:-wassel-delivery-27d8c}"
REGION="${REGION:-europe-west1}"
REPOSITORY="${REPOSITORY:-delivery-containers}"
IMAGE_PREFIX="${IMAGE_PREFIX:-europe-west1-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}}"

BACKEND_SERVICE="${BACKEND_SERVICE:-wassel-delivery-api}"
ADMIN_SERVICE="${ADMIN_SERVICE:-wassel-delivery-admin-web}"
PUBLIC_SERVICE="${PUBLIC_SERVICE:-wassel-delivery-public-web}"

BACKEND_IMAGE="${BACKEND_IMAGE:-${IMAGE_PREFIX}/backend-api:${COMMIT_SHA:-manual}}"
ADMIN_IMAGE="${ADMIN_IMAGE:-${IMAGE_PREFIX}/admin-web:${COMMIT_SHA:-manual}}"
PUBLIC_IMAGE="${PUBLIC_IMAGE:-${IMAGE_PREFIX}/public-web:${COMMIT_SHA:-manual}}"

if [[ $# -lt 1 ]]; then
  echo "Usage: $0 <build-images|deploy-backend|deploy-admin|deploy-public|deploy-all>" >&2
  exit 1
fi

build_images() {
  gcloud artifacts repositories describe "$REPOSITORY" --location "$REGION" --project "$PROJECT_ID" >/dev/null 2>&1 || \
    gcloud artifacts repositories create "$REPOSITORY" --repository-format docker --location "$REGION" --project "$PROJECT_ID"

  gcloud builds submit --project "$PROJECT_ID" --tag "$BACKEND_IMAGE" --file apps/backend-api/Dockerfile .
  gcloud builds submit --project "$PROJECT_ID" --tag "$ADMIN_IMAGE" --file apps/admin-web/Dockerfile .
  gcloud builds submit --project "$PROJECT_ID" --tag "$PUBLIC_IMAGE" --file apps/public-web/Dockerfile .
}

deploy_backend() {
  : "${DATABASE_URL:?DATABASE_URL is required}"
  : "${REDIS_HOST:?REDIS_HOST is required}"
  : "${JWT_ACCESS_SECRET:?JWT_ACCESS_SECRET is required}"
  : "${JWT_REFRESH_SECRET:?JWT_REFRESH_SECRET is required}"

  gcloud run deploy "$BACKEND_SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --image "$BACKEND_IMAGE" \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,PORT=8080,API_PREFIX=api,CORS_ORIGIN=https://admin.wassel.net.ly,APP_VERSION=0.1.0,COMMIT_SHA=${COMMIT_SHA:-manual},JWT_ISSUER=wassel-delivery-api,JWT_AUDIENCE=wassel-delivery-platform,REDIS_HOST=${REDIS_HOST},REDIS_PORT=${REDIS_PORT:-6379},DATABASE_URL=${DATABASE_URL},JWT_ACCESS_SECRET=${JWT_ACCESS_SECRET},JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET},JWT_ACCESS_TTL=${JWT_ACCESS_TTL:-15m},JWT_REFRESH_TTL=${JWT_REFRESH_TTL:-7d}"
}

deploy_admin() {
  gcloud run deploy "$ADMIN_SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --image "$ADMIN_IMAGE" \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,PORT=8080,HOSTNAME=0.0.0.0,API_BASE_URL=https://api.wassel.net.ly/api,NEXT_PUBLIC_API_BASE_URL=https://api.wassel.net.ly/api,SESSION_COOKIE_DOMAIN=admin.wassel.net.ly,SESSION_COOKIE_SECURE=true,SESSION_COOKIE_SAME_SITE=lax"
}

deploy_public() {
  gcloud run deploy "$PUBLIC_SERVICE" \
    --project "$PROJECT_ID" \
    --region "$REGION" \
    --image "$PUBLIC_IMAGE" \
    --allow-unauthenticated \
    --port 8080 \
    --set-env-vars "NODE_ENV=production,PORT=8080,HOSTNAME=0.0.0.0"
}

case "$1" in
  build-images)
    build_images
    ;;
  deploy-backend)
    deploy_backend
    ;;
  deploy-admin)
    deploy_admin
    ;;
  deploy-public)
    deploy_public
    ;;
  deploy-all)
    build_images
    deploy_backend
    deploy_admin
    deploy_public
    ;;
  *)
    echo "Unknown command: $1" >&2
    exit 1
    ;;
esac