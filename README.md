# CosHub - 腾讯云COS可视化管理面板

CosHub 是一个现代化的腾讯云 COS（对象存储）可视化管理面板，专为个人网站图床管理而设计。

## 功能特性

- 🚀 **单账户系统** - 简单安全的单用户管理系统
- 📦 **多存储桶管理** - 支持管理多个COS存储桶
- 🖼️ **智能缩略图** - 自动生成图片缩略图，减少流量消耗
- 🔗 **自定义域名** - 支持配置COS自定义域名
- 🎨 **现代化UI** - 基于 shadcn/ui 的精美界面
- 🔒 **安全存储** - 密钥加密存储，保障数据安全
- ⚡ **自动初始化** - 首次运行自动生成配置文件

## 技术栈

- **框架**: Next.js 15 + TypeScript
- **UI组件**: shadcn/ui + Tailwind CSS v3
- **数据库**: SQLite + Prisma ORM
- **认证**: NextAuth.js
- **状态管理**: Zustand
- **对象存储**: 腾讯云 COS SDK

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/yourusername/coshub.git
cd coshub
```

### 2. 安装依赖

```bash
pnpm install
```

### 3. 初始化数据库

```bash
# 生成Prisma客户端
pnpm db:generate

# 创建数据库
pnpm db:push
```

### 4. 启动开发服务器

```bash
pnpm dev
```

### 5. 完成初始化

访问 http://localhost:3000，系统会自动引导您：

1. **首次运行时**：如果没有检测到环境配置文件，系统会自动生成 `.env.local` 文件
2. **重启服务器**：按照提示重启服务器以应用配置
3. **创建管理员账号**：设置您的用户名和密码

就这么简单！无需手动配置环境变量。

## 项目结构

```
coshub/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API 路由
│   │   ├── dashboard/         # 主面板页面
│   │   │   └── settings/      # 设置页面
│   │   ├── login/             # 登录页面
│   │   └── initialize/        # 初始化页面
│   ├── components/            # React 组件
│   │   ├── ui/               # 基础 UI 组件
│   │   ├── FileManager/      # 文件管理器
│   │   ├── BucketSelector/   # 存储桶选择器
│   │   └── ThumbnailViewer/  # 缩略图查看器
│   ├── lib/                  # 工具库
│   │   ├── cos.ts           # COS SDK 封装
│   │   ├── db.ts            # 数据库连接
│   │   ├── thumbnail.ts     # 缩略图生成
│   │   └── auth.ts          # 认证配置
│   ├── stores/              # Zustand 状态管理
│   └── types/               # TypeScript 类型定义
├── prisma/
│   └── schema.prisma        # 数据库模式
└── package.json
```

## 使用指南

### 初始化设置

首次访问时，系统会引导您完成初始化：
1. 自动生成安全的环境配置
2. 创建管理员账号
3. 登录后即可开始使用

### 添加存储桶

1. 登录后进入设置页面
2. 点击"添加存储桶"
3. 填写存储桶信息：
   - 存储桶名称
   - 所在地域
   - SecretId 和 SecretKey
   - （可选）自定义域名

### 文件管理

- 支持拖拽上传或点击上传
- 自动生成缩略图（图片和视频）
- 批量删除功能
- 文件搜索和筛选

## 开发指南

### 添加新的UI组件

```bash
# 示例：添加Dialog组件
pnpm dlx shadcn@latest add dialog
```

### 数据库迁移

```bash
# 修改schema后执行
pnpm db:push

# 查看数据库
pnpm db:studio
```

## 生产部署

### 构建项目

```bash
pnpm build
```

### 启动生产服务器

```bash
pnpm start
```

### 环境变量（可选）

如果您需要手动配置环境变量，可以创建 `.env.local` 文件：

```env
# NextAuth配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key

# 数据库配置
DATABASE_URL="file:./prisma/dev.db"

# 加密密钥
ENCRYPTION_KEY=your-encryption-key
```

### 使用 Docker（即将支持）

```bash
docker build -t coshub .
docker run -p 3000:3000 coshub
```

## 安全建议

1. **生产环境密钥**: 生产环境部署时建议重新生成所有密钥
2. **HTTPS部署**: 生产环境建议使用HTTPS
3. **定期备份**: 定期备份 SQLite 数据库文件
4. **访问控制**: 可配合反向代理添加额外的访问控制

## 常见问题

### Q: 如何重置密码？

A: 目前需要直接修改数据库。后续版本将添加密码重置功能。

### Q: 支持哪些地域？

A: 支持腾讯云COS的所有地域，包括：
- ap-beijing (北京)
- ap-shanghai (上海)
- ap-guangzhou (广州)
- ap-chengdu (成都)
- 等等...

### Q: 缩略图占用额外存储吗？

A: 
- 图片缩略图会上传到COS占用少量存储
- 视频缩略图使用COS的实时处理功能，不占用额外存储

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License
