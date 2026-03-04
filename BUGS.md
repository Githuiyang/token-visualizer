# Bug Report: Token Visualizer CLI

## Bug #1: State File Mechanism Causing Data Loss

**发现日期**: 2025-03-04

**严重程度**: High - 数据丢失

### 问题描述

OpenClaw 解析器使用状态文件（`~/.token-visualizer/openclaw-state.json`）记录已处理的文件。但 OpenClaw 的数据文件是 `.jsonl` 格式，采用追加写入方式。状态文件机制会跳过"未变化"的文件，导致：

1. 文件新增的数据被忽略
2. 每次 `push` 只会上传第一次的数据
3. 用户需要手动删除状态文件才能获取完整数据

### 根本原因

OpenClaw 的 `.jsonl` 文件是追加写入的，但状态文件基于文件哈希判断是否跳过：
```javascript
// 旧代码问题
const currentHash = getFileHash(filePath);
if (state.processedFiles[fileKey] === currentHash) {
  continue; // 跳过整个文件
}
```

这导致文件新增的行（新数据）永远不会被读取。

### 修复方案

**已修复 (v0.2.11)**: 移除 OpenClaw 解析器的状态文件机制，改为：
- 每次读取完整数据
- 由服务器端处理去重（基于 bucket_start + model + source + project）

### 影响范围

- OpenClaw 用户数据严重不完整
- `--reindex` 参数无法正确工作

---

## Feature Requests: 缺失的调试功能

| 缺失功能       | 影响                         | 建议命令          | 优先级 |
|----------------|------------------------------|-------------------|--------|
| 本地数据统计   | 无法知道有多少数据待上传     | `token-viz stats` | High   |
| State 文件查看 | 无法排查增量上传问题         | `token-viz state` | Medium |
| 数据完整性验证 | 无法确认数据是否遗漏         | `token-viz verify`| High   |
| 数据源状态检查 | 无法知道哪些 parser 正常工作 | `token-viz sources`| Medium |

### `token-viz stats` - 已实现 ✅

显示本地数据统计：
- 总 tokens
- 总成本
- 按模型分类
- 活跃天数

### `token-viz state` - 待实现

查看状态文件内容，排查增量上传问题：
```bash
token-viz state
# State File: ~/.token-visualizer/openclaw-state.json
# Processed files: 8
# Last updated: 2025-03-04 10:00:00
```

### `token-viz verify` - 待实现

对比本地数据与服务器数据：
```bash
token-viz verify
# Local: 15,434,267 tokens, $24.32
# Server: 15,434,267 tokens, $24.32
# ✓ Data is in sync
```

### `token-viz sources` - 待实现

检查各数据源状态：
```bash
token-viz sources
# ✓ claude-code: ~/Library/Application Support/Claude/usage/ (5 sessions)
# ✓ openclaw: ~/.openclaw/agents/main/sessions/ (8 files)
# ✗ opencode: Parser not available (requires better-sqlite3)
```

---

## 相关文件

- `/packages/cli/src/parsers/openclaw.js` - OpenClaw 解析器（已修复）
- `/packages/cli/src/parsers/claude-code.js` - Claude Code 解析器
- `/packages/cli/bin/token-viz.js` - CLI 入口

---

## 修复记录

| 版本 | 日期 | 修复内容 |
|------|------|----------|
| v0.2.11 | 2025-03-04 | 移除 OpenClaw 状态文件机制 |
| v0.2.10 | 2025-03-04 | 更新 GLM 价格配置 |
