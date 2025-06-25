# CosHub 快速设置指南

## 环境变量配置

在项目根目录创建 `.env.local` 文件，并添加以下内容：

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

## 运行项目

1. 安装依赖：
   ```bash
   pnpm install
   ```

2. 初始化数据库：
   ```bash
   pnpm db:push
   ```

3. 启动开发服务器：
   ```bash
   pnpm dev
   ```

4. 访问 http://localhost:3000 开始使用

## 首次使用

1. 系统会自动跳转到初始化页面
2. 创建您的管理员账号
3. 登录后进入设置页面添加存储桶
4. 开始管理您的文件！

## 注意事项

- 请妥善保管您的密钥信息
- 建议定期备份 `prisma/dev.db` 数据库文件
- 生产环境部署时请使用HTTPS 