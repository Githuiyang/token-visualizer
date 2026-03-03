# @token-viz/server

Web server for Token Visualizer with dashboard and API.

## Environment

- `PORT` - Server port (default: 3000)

## API

### POST /api/push

Upload usage data.

Headers:
- `X-API-Key`: Your API key

Body:
```json
{
  "records": [
    {
      "model": "claude-3-opus",
      "bucketStart": "2026-03-02T00:00:00.000Z",
      "source": "claude-code",
      "inputTokens": 1000,
      "outputTokens": 500,
      "cachedInputTokens": 0,
      "cost": { "total": 0.03 }
    }
  ]
}
```

### GET /api/stats

Get usage statistics.

Headers:
- `X-API-Key`: Your API key

### POST /api/key

Generate a new API key.

### GET /dashboard

Web dashboard (requires API key in localStorage or query param).
