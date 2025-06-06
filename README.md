# Cloudflare Workers 代理服务

这是一个基于 Cloudflare Workers 的边缘代理服务，目前主要提供 CORS 跨域请求处理功能。

## 功能特性

### 已实现功能
- 🔄 CORS 跨域请求处理
- 🌍 默认代理功能（支持部分网站代理，自动转发并重写资源链接）

### 开发计划
- 🌐 科学上网代理
- 🎭 请求头伪装
- 🛡️ 内容审查和过滤
- 📊 请求统计和监控
- 🔒 安全特性增强
- 🚀 性能优化

## 技术栈

- ⚡ Cloudflare Workers（无服务器边缘计算）
- 🚀 Hono.js（Web 框架，支持 SSR）
- 🛡️ TypeScript（类型安全）
- 🛠️ Vite（开发与构建工具）
- 🔧 Wrangler（开发与部署工具）
- 🥖 Bun（包管理与运行环境）

## 快速开始

### 前置要求

- 📦 Node.js 18+ 或 [Bun](https://bun.sh/)
- ☁️ Cloudflare 账号
- 🔧 Wrangler CLI

### 安装

```bash
# 使用 bun 安装依赖
bun install

# 或使用 npm 安装依赖
npm install
```

### 开发

```bash
# 本地开发
bun run dev
# 或
npm run dev
```

### 部署

```bash
# 部署到 Cloudflare Workers
bun run deploy
# 或
npm run deploy
```

### 类型生成

```bash
# 生成 Cloudflare Workers 类型定义
bun run cf-typegen
# 或
npm run cf-typegen
```

## 配置说明

### Wrangler 配置

项目使用 `wrangler.jsonc` 进行配置，主要配置项包括：

- `name`: Worker 名称
- `main`: 入口文件
- `compatibility_date`: 兼容性日期
- `observability`: 可观测性配置

## 注意事项

1. ⚠️ 请确保遵守 Cloudflare Workers 的使用限制和条款
2. 🔒 建议在生产环境中配置适当的安全措施
3. 🗝️ 注意处理敏感信息和 API 密钥

## 许可证

本项目采用 MIT 许可证。详细信息请参阅 LICENSE 文件。

感谢您的使用！如果您对这个项目有任何改进或建议，也欢迎贡献代码或提出问题。

## 默认代理功能说明

本服务支持将部分网站的内容通过本地代理访问，自动处理跨域和资源重写。

### 使用方法

只需访问如下格式的地址：

```
/proxy?url=<目标网站地址>
```

例如：

```
/proxy?url=https://tool.oschina.net/apidocs/apidoc?api=jdk-zh
```

如需对 HTML 内容中的资源链接进行重写（确保后续资源也通过代理加载），可加上 `rewrite=1` 参数：

```
/proxy?url=https://tool.oschina.net/apidocs/apidoc?api=jdk-zh&rewrite=1
```

所有被重写的资源链接也会自动带上 `rewrite=1`，保证代理链路一致。

> 注意：仅支持部分公开网站，部分受限或需登录的网站可能无法正常代理。
