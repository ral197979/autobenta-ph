#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/.."
echo "Seeding demo environment..."
node backend/prisma/seedDemo.js
echo "Demo seed complete."
