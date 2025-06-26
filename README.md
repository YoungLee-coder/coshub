# CosHub - 腾讯云 COS 可视化管理系统

<div align="center">
  <h1>🚀 CosHub</h1>
  <p><strong>专业的腾讯云对象存储(COS)管理面板</strong></p>
  <p>为个人开发者和小型团队打造的现代化存储管理解决方案</p>

  [![Next.js](https://img.shields.io/badge/Next.js-15.0-black?logo=next.js)](https://nextjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?logo=typescript)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.0-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)
  [![License](https://img.shields.io/badge/license-MIT-green)](./LICENSE)
</div>

## 📋 目录

- [功能特性](#-功能特性)
- [系统架构](#-系统架构)
- [快速开始](#-快速开始)
- [部署指南](#-部署指南)
- [使用说明](#-使用说明)
- [性能优化](#-性能优化)
- [开发指南](#-开发指南)
- [常见问题](#-常见问题)

## ✨ 功能特性

### 核心功能
- 🗂️ **多存储桶管理** - 统一管理多个 COS 存储桶，支持快速切换
- 📁 **完整文件操作** - 上传、下载、删除、批量操作、文件夹管理
- 🖼️ **智能缩略图系统** - 自动生成缩略图，支持图片和视频预览
- 🔍 **高级搜索过滤** - 支持按文件类型、大小、时间等多维度筛选
- 📤 **拖拽上传** - 支持拖拽上传和批量文件处理
- 🔗 **自定义域名** - 完整的 CDN 域名配置支持
- 👤 **账号管理** - 支持修改用户名和密码

### 性能优化
- ⚡ **三级缓存机制** - React Query + IndexedDB + HTTP 缓存
- 🚀 **虚拟滚动** - 大量文件列表的流畅渲染
- 📊 **流量优化** - 自动使用缩略图，减少带宽消耗
- 🔄 **并发控制** - 批量操作的智能并发管理

### 安全特性
- 🔐 **用户认证** - 基于 NextAuth.js 的安全认证系统
- 🔒 **密钥加密** - AES-256-GCM 加密存储敏感信息
- 🛡️ **访问控制** - 完整的权限验证机制
- 📝 **操作日志** - 关键操作的日志记录

### 用户体验
- 🎨 **现代化 UI** - 基于 shadcn/ui 的精美界面
- 📱 **响应式设计** - 完美适配各种设备
- 🌓 **深色模式** - 支持明暗主题切换

## 🏗️ 系统架构

### 技术栈

| 类别 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Next.js 15 | 基于 App Router 的全栈框架 |
| 语言 | TypeScript 5 | 类型安全的开发体验 |
| 样式 | Tailwind CSS | 原子化 CSS 框架 |
| UI库 | shadcn/ui | 高质量的组件库 |
| 数据库 | Prisma + SQLite | 轻量级本地数据库 |
| 认证 | NextAuth.js | 安全的身份验证 |
| 状态管理 | Zustand | 简洁的状态管理 |
| 数据获取 | React Query | 强大的服务端状态管理 |
| 图片处理 | Sharp | 高性能图片处理 |
| 对象存储 | cos-nodejs-sdk-v5 | 腾讯云官方 SDK |

### 项目结构

```
coshub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   ├── dashboard/         # 主面板页面
│   │   ├── login/            # 登录页面
│   │   └── initialize/       # 初始化页面
│   ├── components/            # React 组件
│   │   ├── FileManager/      # 文件管理器组件
│   │   ├── BucketSelector/   # 存储桶选择器
│   │   └── ui/              # UI 基础组件
│   ├── lib/                  # 工具函数库
│   │   ├── cos.ts           # COS 操作封装
│   │   ├── cache.ts         # 缓存管理
│   │   └── thumbnail.ts     # 缩略图处理
│   ├── stores/              # Zustand 状态管理
│   └── types/               # TypeScript 类型定义
├── prisma/                  # 数据库模型
├── public/                  # 静态资源
└── docs/                    # 文档
```

## 🚀 快速开始

### 系统要求

- Node.js 18.0 或更高版本
- pnpm 8.0 或更高版本
- 腾讯云账号及 COS 服务

### 安装步骤

#### 开发环境

1. **克隆仓库**
```bash
git clone https://github.com/yourusername/coshub.git
cd coshub
```

2. **安装依赖**
```bash
pnpm install
```

3. **启动开发服务器**
```bash
pnpm dev
```

4. **访问应用**
   - 浏览器访问 `http://localhost:5030`
   - 首次启动会自动创建管理员账号
   - **请注意控制台输出的默认密码**

#### 生产环境

1. **克隆并安装**
```bash
git clone https://github.com/yourusername/coshub.git
cd coshub
pnpm install
```

2. **构建项目**
```bash
pnpm build
```

3. **启动服务**
```bash
pnpm start
```

4. **获取管理员密码**
   - 首次启动时，控制台会显示自动生成的管理员密码
   - 默认用户名：`admin`
   - 密码：查看控制台输出

> 💡 **提示**: CosHub 现在采用自动初始化机制，首次运行时会：
> - 自动创建环境配置文件
> - 自动初始化数据库
> - 自动创建管理员账号（用户名：admin，密码随机生成）
> - 默认运行在 **5030** 端口

### 默认配置

- **默认端口**: 5030
- **默认用户名**: admin
- **默认密码**: 随机生成（查看控制台）

### 账号管理

1. 使用控制台显示的密码登录
2. 进入「设置」页面
3. 在「账号管理」部分可以：
   - 修改用户名
   - 修改密码

## 🌐 部署指南

### 自定义端口运行

CosHub 默认运行在 5030 端口，如需修改：

#### 开发环境

**Linux/macOS:**
```bash
PORT=8080 pnpm dev
```

**Windows (PowerShell):**
```powershell
$env:PORT=8080; pnpm start:custom
```

**Windows (CMD):**
```cmd
set PORT=8080 && pnpm start:custom
```

#### 生产环境

**Linux/macOS:**
```bash
# 构建项目
pnpm build

# 使用自定义端口启动
PORT=8080 pnpm start:custom
```

**Windows (PowerShell):**
```powershell
# 构建项目
pnpm build

# 使用自定义端口启动
$env:PORT=8080; pnpm start:custom
```

#### 环境变量配置
如果需要手动配置，可以编辑 `.env.local` 文件：
```env
# NextAuth配置
NEXTAUTH_URL=http://localhost:5030  # 修改为您的地址和端口
PORT=5030  # 修改为您需要的端口
```

### Vercel 部署（推荐）

1. Fork 本仓库到您的 GitHub 账号
2. 在 [Vercel](https://vercel.com) 导入项目
3. 配置环境变量：
   ```env
   NEXTAUTH_URL=https://your-domain.vercel.app
   NEXTAUTH_SECRET=生成的密钥
   ENCRYPTION_KEY=生成的加密密钥
   ```
4. 部署完成后访问初始化页面完成设置

### Docker 部署

```bash
# 构建镜像
docker build -t coshub .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -v ./data:/app/prisma \
  -e NEXTAUTH_URL=http://localhost:3000 \
  --name coshub \
  coshub
```

### 传统部署

```bash
# 构建生产版本
pnpm build

# 启动生产服务器
pnpm start
```

### 重置应用

如果需要完全重置应用，请删除以下文件和目录：

#### Linux/macOS：

1. **数据库文件**：
   ```bash
   rm -rf prisma/dev.db*
   ```

2. **环境配置文件**：
   ```bash
   rm .env.local
   ```

3. **缓存和临时文件**（可选）：
   ```bash
   rm -rf .next/
   rm -rf node_modules/.cache/
   ```

#### Windows：

1. **数据库文件**：
   ```powershell
   Remove-Item -Path "prisma\dev.db*" -Force -ErrorAction SilentlyContinue
   ```

2. **环境配置文件**：
   ```powershell
   Remove-Item -Path ".env.local" -Force -ErrorAction SilentlyContinue
   ```

3. **缓存和临时文件**（可选）：
   ```powershell
   Remove-Item -Path ".next\" -Recurse -Force -ErrorAction SilentlyContinue
   Remove-Item -Path "node_modules\.cache\" -Recurse -Force -ErrorAction SilentlyContinue
   ```

4. **重新初始化**：
   ```bash
   # 重新安装依赖（可选）
   pnpm install
   
   # 启动应用
   pnpm dev
   ```

删除这些文件后，再次访问应用时会自动跳转到初始化页面，您可以重新设置管理员账号和配置。

## 📖 使用说明

### 存储桶配置

1. 登录系统后进入「设置」页面
2. 点击「添加存储桶」
3. 填写必要信息：
   - **存储桶名称**：您在腾讯云创建的存储桶名
   - **所在地域**：如 ap-guangzhou、ap-beijing 等
   - **SecretId/SecretKey**：从腾讯云控制台获取
   - **自定义域名**（可选）：配置的 CDN 加速域名

### 文件管理操作

#### 上传文件
- **方式一**：点击「上传文件」按钮选择文件
- **方式二**：直接拖拽文件到文件列表区域
- **批量上传**：支持同时选择多个文件上传

#### 文件操作
- **预览**：点击文件名或缩略图预览
- **下载**：右键菜单或操作按钮下载
- **删除**：支持单个或批量删除
- **复制链接**：快速获取文件访问链接

#### 高级功能
- **搜索过滤**：使用顶部搜索栏快速查找文件
- **批量操作**：勾选多个文件进行批量处理
- **文件夹管理**：支持创建文件夹组织文件

### 缓存管理

系统提供三级缓存机制，可在设置页面管理：
- **清理缓存**：释放本地存储空间
- **查看缓存大小**：了解缓存占用情况
- **缓存策略**：自动过期和容量限制

## ⚡ 性能优化

### 缩略图优化
- 图片自动生成 300x300 缩略图
- 视频自动截取第一帧作为封面
- 使用 CDN 加速缩略图访问

### 缓存策略
- React Query 内存缓存（5分钟）
- IndexedDB 持久化缓存（7天）
- HTTP 缓存头优化

### 批量操作优化
- 并发控制（最多5个并发）
- 进度实时反馈
- 错误自动重试

## 🛠️ 开发指南

### 本地开发

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 类型检查
pnpm type-check

# 代码格式化
pnpm format

# 构建项目
pnpm build
```

### API 接口文档

#### 认证接口
- `POST /api/auth/[...nextauth]` - NextAuth 认证处理
- `POST /api/auth/initialize` - 系统初始化

#### 存储桶接口
- `GET /api/buckets` - 获取存储桶列表
- `POST /api/buckets` - 创建新存储桶
- `PUT /api/buckets/[id]` - 更新存储桶信息
- `DELETE /api/buckets/[id]` - 删除存储桶

#### 文件接口
- `GET /api/files` - 获取文件列表（支持分页）
- `POST /api/files` - 上传文件
- `DELETE /api/files/[id]` - 删除单个文件
- `DELETE /api/files/batch` - 批量删除文件
- `POST /api/files/compress` - 批量压缩下载

## ❓ 常见问题

### Q: 如何获取腾讯云密钥？
A: 登录[腾讯云控制台](https://console.cloud.tencent.com/cam/capi)，在「访问密钥」页面创建新密钥。

### Q: 支持哪些文件格式的预览？
A: 支持常见图片格式（jpg、png、gif、webp）和视频格式（mp4、webm）的在线预览。

### Q: 如何配置自定义域名？
A: 在腾讯云 COS 控制台配置 CDN 加速域名后，在存储桶设置中填入该域名即可。

### Q: 数据库可以更换吗？
A: 可以，修改 `prisma/schema.prisma` 中的 provider，支持 PostgreSQL、MySQL 等。

### Q: 忘记管理员密码怎么办？
A: 删除 `prisma/dev.db` 文件，重新运行应用会自动创建新的管理员账号。

## 🔧 故障排查

### 启动时报错 "Cannot find module 'dotenv'"
确保已安装所有依赖：
```bash
pnpm install
```

### 数据库相关错误
如果遇到数据库错误，可以尝试：
```bash
# 删除现有数据库
rm -rf prisma/dev.db*

# 重新运行应用，会自动创建数据库
pnpm dev
```

### 端口被占用
如果默认端口 5030 被占用，可以使用其他端口：
```bash
PORT=8080 pnpm start
```

### Windows 下的权限问题
在 Windows 下如果遇到权限问题，请以管理员身份运行 PowerShell。

### 服务器部署注意事项
部署到服务器时，确保正确配置 `NEXTAUTH_URL`：
```bash
# 编辑 .env.local
NEXTAUTH_URL=http://你的服务器IP:5030
```

### JWT 会话错误
如果看到 `JWT_SESSION_ERROR`，这通常是因为更换了 `NEXTAUTH_SECRET`。解决方法：
1. 清除浏览器 Cookie
2. 重新登录即可

## 🤝 贡献指南

欢迎贡献代码和提出建议！

1. Fork 本仓库
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 提交 Pull Request

## 📄 开源协议

本项目基于 [MIT License](./LICENSE) 开源。

## 🙏 致谢

- [Next.js](https://nextjs.org/) - React 全栈框架
- [shadcn/ui](https://ui.shadcn.com/) - 优秀的组件库
- [Tailwind CSS](https://tailwindcss.com/) - 原子化 CSS 框架
- [腾讯云 COS](https://cloud.tencent.com/product/cos) - 对象存储服务

---

<div align="center">
  <p>如果这个项目对您有帮助，请给一个 ⭐ Star！</p>
  <p>Made with ❤️ by CosHub Contributors</p>
</div>
