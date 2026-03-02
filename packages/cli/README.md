# @token-viz/cli

CLI tool for Token Visualizer.

## Commands

### token-viz generate

Generate a PNG visualization.

```bash
token-viz generate -o usage.png
```

### token-viz push

Upload usage data to server.

```bash
token-viz push --server http://localhost:3000
```

Or use saved config:

```bash
token-viz config --set-key KEY --set-server URL
token-viz push
```

### token-viz config

Manage configuration.

```bash
token-viz config --set-key YOUR_KEY
token-viz config --set-server http://localhost:3000
token-viz config --show
```

### token-viz stats

Show statistics without uploading.

```bash
token-viz stats
```
