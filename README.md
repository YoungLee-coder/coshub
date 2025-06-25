# CosHub - 腾讯云 COS 可视化管理面板

<div align="center">
  <img src="public/logo.png" alt="CosHub Logo" width="128" height="128" />
  <h3>一个简洁、高效的腾讯云 COS 对象存储管理工具</h3>
  <p>专为个人网站图床管理设计，支持多存储桶管理、文件预览、批量操作等功能</p>
</div>

## ✨ 功能特性

- 🗂️ **多存储桶管理** - 支持同时管理多个 COS 存储桶
- 📁 **文件管理** - 上传、下载、删除、批量操作
- 🖼️ **智能缩略图** - 自动生成图片和视频缩略图，节省流量
- 🔗 **自定义域名** - 支持配置和使用自定义 CDN 域名
- 📤 **拖拽上传** - 支持拖拽和批量上传文件
- 🔍 **文件预览** - 支持图片、视频等多种格式在线预览
- 🔐 **安全认证** - 内置用户认证系统，支持单用户模式
- 🎨 **现代化界面** - 基于 shadcn/ui 的美观响应式设计

## 🚀 快速开始

### 环境要求

- Node.js 18.x 或更高版本
- pnpm 包管理器
- 腾讯云 COS 服务

### 安装步骤

1. **克隆项目**
```bash
git clone https://github.com/your-username/coshub.git
cd coshub
```

2. **安装依赖**
```bash
pnpm install
```

3. **初始化数据库**
```bash
pnpm db:push
```

4. **启动开发服务器**
```bash
pnpm dev
```

5. **访问初始化页面**
打开浏览器访问 `http://localhost:3000/initialize`，按照引导完成初始化设置。

### 环境配置

初始化过程会自动创建 `.env.local` 文件，包含以下配置：

```env
# 应用配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key
ENCRYPTION_KEY=your-encryption-key

# 数据库配置（默认使用 SQLite）
DATABASE_URL="file:./prisma/dev.db"
```

## 📖 使用指南

### 1. 添加存储桶

1. 登录后进入设置页面
2. 点击"添加存储桶"
3. 填写存储桶信息：
   - 存储桶名称
   - 所在地域
   - SecretId 和 SecretKey
   - 自定义域名（可选）

### 2. 文件管理

- **上传文件**：点击"上传文件"按钮或直接拖拽文件到页面
- **批量操作**：勾选多个文件后可进行批量删除
- **文件预览**：点击文件名或预览图标查看详情
- **下载文件**：在操作菜单中选择下载

### 3. 缩略图配置

系统会自动为图片和视频生成缩略图：
- 图片：使用 Sharp 库生成 300x300 的缩略图
- 视频：使用 COS 数据处理功能生成视频截帧

## 🛠️ 技术栈

- **框架**: Next.js 15 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: shadcn/ui
- **数据库**: Prisma + SQLite
- **认证**: NextAuth.js
- **状态管理**: Zustand
- **COS SDK**: cos-nodejs-sdk-v5

## 📝 API 接口

### 认证相关
- `POST /api/auth/initialize` - 系统初始化
- `POST /api/auth/[...nextauth]` - NextAuth 认证

### 存储桶管理
- `GET /api/buckets` - 获取存储桶列表
- `POST /api/buckets` - 创建存储桶
- `PUT /api/buckets/[id]` - 更新存储桶
- `DELETE /api/buckets/[id]` - 删除存储桶

### 文件管理
- `GET /api/files` - 获取文件列表
- `POST /api/files` - 上传文件
- `DELETE /api/files/[id]` - 删除单个文件
- `DELETE /api/files/batch` - 批量删除文件

## 🔒 安全说明

- 所有敏感信息（如 SecretKey）都经过 AES-256-GCM 加密存储
- 支持单用户模式，适合个人使用
- 建议在生产环境中使用 HTTPS
- 定期更新依赖以修复安全漏洞

## 🤝 贡献指南

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License

---

<div align="center">
  <p>Made with ❤️ by CosHub Team</p>
</div>
