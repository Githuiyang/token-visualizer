# @token-viz/cli

CLI tool for Token Visualizer.

## 🔒 Privacy & Security

> **Your data stays private. We only collect usage statistics.**

- ✅ **只读取统计信息** - 仅读取 tokens、模型、成本等使用数据
- ✅ **不读取任何代码内容** - 不扫描、不上传你的源代码
- ✅ **不读取对话内容** - 你的聊天记录完全私密
- ✅ **不开源** - 未经你的同意，不会读取任何项目文件
- ✅ **数据仅用于个人可视化** - 上传的数据仅用于生成你的个人使用报表

### 数据读取来源

该工具只读取以下**使用统计**文件：

| 来源 | 读取内容 | 位置 |
|------|----------|------|
| Claude Code | tokens、模型、成本 | `~/Library/Application Support/Claude/usage/` |
| OpenClaw | tokens、模型、成本 | `~/.openclaw/agents/*/sessions/*.jsonl` |

### 网络请求

- 数据仅发送到**你配置的服务器**（默认：https://token-visualizer-fresh.vercel.app）
- 使用 HTTPS 加密传输
- 可随时停止使用，无需任何卸载步骤

---

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

### token-viz start-daemon

自动后台上传，每小时同步一次。

```bash
token-viz start-daemon
```
