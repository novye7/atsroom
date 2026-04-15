# At's Room

> 你所有 @ 地址的房间

个人邮箱地址管理工具。集中记录和管理你的所有邮箱地址，支持分组标签、多地址绑定、拖拽排序。

## 架构

```
packages/ui/          共享 UI 组件库（React + Tailwind CSS）
apps/server/          服务端版本（Next.js + better-sqlite3 + Drizzle ORM）
apps/static/          静态版本（Next.js export + Dexie/IndexedDB）
```

- **Server 版本**：数据存储在服务端 SQLite 数据库，支持密码保护，适合自托管部署
- **Static 版本**：数据存储在浏览器 IndexedDB，无需后端，适合快速体验

两个版本共享同一套 UI 组件（`packages/ui`），通过不同的 Data Provider 适配数据层。

## 快速开始

### 本地开发

```bash
# 安装依赖
npm install

# 启动 server 版本（默认 http://localhost:3000）
npm run dev:server

# 或启动 static 版本
npm run dev:static
```

Server 版本首次启动时会在 `data/` 目录创建 SQLite 数据库。密码通过 `.env` 配置：

```bash
cp apps/server/.env.example apps/server/.env
# 编辑 .env 设置 AUTH_PASSWORD
```

### Docker 部署（Server 版本）

```bash
docker compose up -d
```

默认密码为 `changeme`，通过 `docker-compose.yml` 中的 `AUTH_PASSWORD` 环境变量修改。数据持久化在 Docker volume 中。

## 技术栈

- **框架**：Next.js 16（App Router）
- **UI**：React 19 + Tailwind CSS 4
- **数据库（Server）**：better-sqlite3 + Drizzle ORM
- **数据库（Static）**：Dexie（IndexedDB）
- **语言**：TypeScript
- **容器**：Docker 多阶段构建

## License

[MIT](LICENSE)
