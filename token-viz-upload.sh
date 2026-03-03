#!/bin/bash
# Token Visualizer Upload Script
# This script parses local AI usage data and uploads it to the server
# Usage: ./token-viz-upload.sh YOUR_API_KEY [SERVER_URL]

API_KEY="${1:-}"
SERVER_URL="${2:-https://traetoken-visualizer-freshw1cm.vercel.app}"

if [ -z "$API_KEY" ]; then
  echo "Usage: ./token-viz-upload.sh YOUR_API_KEY [SERVER_URL]"
  echo "Example: ./token-viz-upload.sh tv_xxxxx https://example.com"
  exit 1
fi

echo "Token Visualizer - Uploading usage data..."
echo "Server: $SERVER_URL"
echo ""

# Find project directory
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Parse and upload
cd "$PROJECT_DIR/packages/cli"
node -e "
import { parseAll } from './src/parsers/index.js';
const buckets = await parseAll();
if (buckets.length === 0) {
  console.log('No usage data found. Have you used any AI tools today?');
  process.exit(0);
}
console.log(JSON.stringify({ records: buckets }));
" | curl -s -X POST "$SERVER_URL/api/push" \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $API_KEY" \
  -d @-

echo ""
echo "✓ Upload complete!"
echo "View your dashboard: $SERVER_URL/dashboard?key=$API_KEY"
