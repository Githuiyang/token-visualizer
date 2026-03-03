#!/bin/bash
# Token Visualizer Upload Script
# Usage: ./upload.sh [API_KEY] [SERVER_URL]

API_KEY="${1:-tv_7be7e29c803743002a69d5bfe0223}"
SERVER_URL="${2:-https://traetoken-visualizer-freshw1cm.vercel.app}"

echo "Uploading to $SERVER_URL..."

# Parse data and upload
cd "$(dirname "$0")/packages/cli"

node -e "
import { parseAll } from './src/parsers/index.js';
const buckets = await parseAll();
console.log(JSON.stringify({ records: buckets }));
" | curl -s -X POST "$SERVER_URL/api/push" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d @-

echo ""
echo "✓ Upload complete!"
echo "View dashboard: $SERVER_URL/dashboard?key=$API_KEY"
