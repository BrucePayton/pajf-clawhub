#!/bin/bash
set -e  # Exit immediately if any command fails

echo "=== Removing node_modules and package-lock.json ==="
rm -rf node_modules/ package-lock.json

echo "=== Pulling latest code from git ==="
git pull

echo "=== Stopping Docker Compose ==="
docker compose down

echo "=== Installing npm dependencies ==="
npm install

echo "=== Building the project ==="
npm run build

echo "=== Final Docker Compose up ==="
docker compose up -d --build

echo "=== Done ==="