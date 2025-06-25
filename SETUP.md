# CosHub 快速设置指南

## 自动初始化

CosHub 现在支持自动初始化！首次运行时，系统会自动为您生成安全的配置文件。

### 快速开始步骤

1. **安装依赖**
   ```bash
   pnpm install
   ```

2. **初始化数据库**
   ```bash
   pnpm db:push
   ```

3. **启动服务器**
   ```bash
   pnpm dev
   ```

4. **访问初始化页面**
   - 打开浏览器访问 http://localhost:3000
   - 系统会自动跳转到初始化页面

5. **完成初始化**
   - 如果系统检测到缺少环境配置，会自动生成 `.env.local` 文件
   - 按照提示重启服务器（Ctrl+C 停止，然后重新运行 `pnpm dev`）
   - 刷新页面，创建您的管理员账号

## 手动配置（可选）

如果您希望手动配置环境变量，可以在项目根目录创建 `.env.local` 文件：

```env
# NextAuth配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here-please-change-it

# 数据库配置
DATABASE_URL="file:./prisma/dev.db"

# 加密密钥（用于加密存储桶密钥）
ENCRYPTION_KEY=your-encryption-key-here-please-change-it
```

### 生成安全密钥

您可以使用以下命令生成安全的随机密钥：

**Linux/MacOS:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[System.Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Maximum 256}))
```

**或使用Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

## 获取腾讯云COS配置

1. 登录[腾讯云控制台](https://console.cloud.tencent.com/)
2. 进入"对象存储COS"服务
3. 创建存储桶或使用现有存储桶
4. 记录以下信息：
   - 存储桶名称（例如：my-bucket-1234567890）
   - 所属地域（例如：ap-beijing）
   
5. 获取API密钥：
   - 进入"访问管理" > "访问密钥" > "API密钥管理"
   - 创建新密钥或使用现有密钥
   - 记录 SecretId 和 SecretKey

## 配置自定义域名（可选）

如果您已为COS存储桶配置了自定义域名：

1. 在腾讯云COS控制台中配置域名
2. 完成域名验证和CNAME配置
3. 在CosHub中添加存储桶时填写自定义域名

## 首次使用

1. 系统会自动跳转到初始化页面
2. 创建您的管理员账号
3. 登录后进入设置页面添加存储桶
4. 开始管理您的文件！

## 注意事项

- 请妥善保管您的密钥信息
- 建议定期备份 `prisma/dev.db` 数据库文件
- 生产环境部署时请使用HTTPS 