# 生产环境就绪更新报告 (2026-03-03)

## 概述
为了确保 Token Visualizer 服务在生产环境中的安全性、稳定性和可维护性，我们对 Server 端和 CLI 端进行了关键的架构优化和代码加固。

## 详细改动清单

### 1. Server 端安全性增强
- **Web 安全头 (Helmet)**: 
  - 引入 `helmet` 中间件，自动设置 HTTP 安全响应头（如 `Content-Security-Policy`, `X-Frame-Options` 等）。
  - **CSP 配置**: 显式允许 `cdn.jsdelivr.net` (用于加载 ECharts 图表库) 和内联脚本 (用于 EJS 模板数据注入)。
  - 作用：防御 XSS、点击劫持等常见 Web 攻击，同时确保前端可视化组件正常运行。
- **请求速率限制 (Rate Limiting)**:
  - 引入 `express-rate-limit`，限制 `/api/` 路由的请求频率（默认：每 IP 15 分钟 100 次请求）。
  - 作用：防止暴力破解 API Key 和 DoS 攻击。
- **跨域资源共享 (CORS)**:
  - 引入 `cors` 中间件，规范跨域访问策略。
  - 作用：允许受信任的前端应用访问 API。
- **安全 API Key 生成**:
  - **旧方案**: `Math.random()` (伪随机，不可预测性低)。
  - **新方案**: `crypto.randomBytes(16)` (加密安全随机数)。
  - 作用：生成极难被预测的 API Key，提升认证安全性。

### 2. 稳定性与性能优化
- **大数据量上传支持**:
  - 调整 Express JSON 解析限制：`app.use(express.json({ limit: '10mb' }))`。
  - 作用：防止在大批量上传 Usage 记录时因 Payload 过大导致 `413 Payload Too Large` 错误。
- **输入数据校验**:
  - 增强 `/api/push` 接口的字段类型检查。
  - 限制 `model` 字段长度，防止数据库字段溢出。
  - 强制转换数值字段，防止 `NaN` 或非法类型污染数据库。

### 3. 部署灵活性
- **数据库路径配置**:
  - 支持 `DB_PATH` 环境变量。
  - **旧方案**: 硬编码在 `node_modules` 或源码目录。
  - **新方案**: `process.env.DB_PATH || join(__dirname, 'data.db')`。
  - 作用：方便在 Docker 或云环境中将数据库文件挂载到持久化存储卷。

### 4. 代码清理
- **CLI 图表生成**:
  - 移除了 `generateSVG` 中重复调用的 `generateBarChartSVG` 代码。
  - 作用：减少冗余计算，提升代码可读性。

---

## 本地验证指南

### 1. 安装新增依赖
Server 端引入了新的安全包，需要确保依赖已安装：

```bash
cd packages/server
npm install
```
*(注：刚才的自动更新过程中已执行过此步骤)*

### 2. 启动服务
使用默认配置启动开发服务器：

```bash
# 在 packages/server 目录下
npm run dev
```

或者测试自定义数据库路径（模拟生产环境配置）：

```bash
# 在 packages/server 目录下
DB_PATH=/tmp/test-token-viz.db npm run dev
```

### 3. 验证功能

**测试 1: 服务健康检查**
访问 http://localhost:3000/health，应返回 `{"status":"ok"}`。

**测试 2: 数据上传**
在另一个终端中使用 CLI 上传数据：

```bash
# 在项目根目录
npm run push
```
如果这是第一次运行，它会自动注册并生成 API Key。

**测试 3: 验证速率限制 (可选)**
如果您连续快速请求 API 超过 100 次，应该会收到 `429 Too Many Requests` 错误。

---

## 部署建议
在生产环境中部署时，建议设置以下环境变量：

- `NODE_ENV=production`: 开启生产模式优化。
- `PORT`: 指定服务端口（例如 8080）。
- `DB_PATH`: 指定持久化的数据库文件路径。
