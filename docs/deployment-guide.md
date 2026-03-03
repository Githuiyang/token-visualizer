# Token Visualizer 部署与数据持久化指南

## 现状：Vercel + SQLite (文件版)
你目前的部署使用的是 Vercel 的 Serverless 环境配合本地 SQLite 文件 (`data.db`)。

### ✅ 适用场景
- **短期演示/测试**：快速展示功能，给同事看一眼。
- **无状态服务**：如果不需要保存数据（比如只做实时计算），这是完美的。
- **开发调试**：验证 API 接口连通性。

### ⚠️ 局限性 (为什么不安全)
- **数据易失性**：Vercel 的文件系统是**临时(Ephemeral)**的。当函数休眠、重新部署或实例重启时，写入 `data.db` 的所有数据（用户注册、Usage 记录）都会**立即消失**，重置为初始状态。
- **并发限制**：SQLite 文件锁在 Serverless 环境下可能导致写入冲突。

---

## 长期方案：持久化存储

为了长期稳定运行，你需要将数据库从“本地文件”迁移到“云端数据库服务”。

### 推荐方案 1: Supabase (PostgreSQL)
最成熟的选择，提供强大的管理后台。

1.  **创建项目**：在 Supabase 创建一个免费项目。
2.  **获取连接串**：获取 PostgreSQL Connection String。
3.  **代码适配**：
    - 安装 `pg` 库替换 `better-sqlite3`。
    - 将 SQL 语法微调为 Postgres 兼容（目前的 SQL 基本兼容）。
    - 修改 `packages/server/db/index.js` 连接远程数据库。

### 推荐方案 2: Turso (LibSQL)
如果你非常喜欢 SQLite 的开发体验，Turso 是最佳选择。它是基于 SQLite 的边缘数据库。

> **当前代码已完成适配！**
> 我们已经引入了 `@libsql/client` 并将数据库层重构为异步模式。现在只需在 Vercel 中配置环境变量即可启用。

#### 启用步骤：
1.  **注册 Turso**：访问 [turso.tech](https://turso.tech) 并创建一个数据库。
2.  **获取凭证**：
    - `Database URL`: 格式为 `libsql://your-db.turso.io`
    - `Auth Token`: 点击 Generate Token 获取。
3.  **配置 Vercel**：
    - 进入 Vercel 项目设置 -> Environment Variables。
    - 添加 `TURSO_DATABASE_URL`。
    - 添加 `TURSO_AUTH_TOKEN`。
4.  **重新部署**：在 Vercel 中 Redeploy。

一旦配置生效，应用会自动从本地 SQLite 模式切换到远程 Turso 模式，数据将永久保存。

### 推荐方案 3: Neon (Serverless Postgres)
专为 Serverless 设计的 Postgres，与 Vercel 集成极佳。

---

## 迁移路线图 (如果决定长期使用)

如果你决定长期使用，我们可以按照以下步骤升级：

1.  **选择数据库**：建议 **Turso** (改动最小) 或 **Supabase** (生态最强)。
2.  **安装驱动**：`npm install @libsql/client` 或 `npm install pg`。
3.  **重构 DB 层**：修改 `packages/server/db/index.js`，通过环境变量 `DATABASE_URL` 连接云数据库。
4.  **配置环境变量**：在 Vercel 后台填入数据库连接串。

**结论**：现在的版本非常适合**尝鲜和演示**。一旦你需要正式记录团队几周甚至几个月的数据，**必须**迁移到上述云数据库之一。
