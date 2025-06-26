const { writeFileSync, existsSync } = require('fs')
const { join } = require('path')
const crypto = require('crypto')
const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const os = require('os')
const { execSync } = require('child_process')

// 生成随机密码
function generateRandomPassword(length = 12) {
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
  let password = ''
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length))
  }
  return password
}

// 获取本机IP地址
function getLocalIP() {
  const interfaces = os.networkInterfaces()
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  
  return 'localhost'
}

async function initializeApp() {
  try {
    console.log('🚀 CosHub 启动初始化...')
    
    // 检查是否存在 .env.local 文件
    const envPath = join(process.cwd(), '.env.local')
    const envExists = existsSync(envPath)
    
    if (!envExists) {
      console.log('📝 首次运行，正在创建环境配置...')
      
      // 使用端口 5030 作为默认端口
      const port = '5030'
      
      // 尝试自动检测访问地址
      let nextAuthUrl = process.env.NEXTAUTH_URL
      if (!nextAuthUrl) {
        // 如果有环境变量指定，使用环境变量
        const host = process.env.HOST || getLocalIP()
        nextAuthUrl = `http://${host}:${port}`
        console.log(`📌 自动检测访问地址: ${nextAuthUrl}`)
        console.log('   如需使用其他地址，请设置 NEXTAUTH_URL 环境变量')
      }
      
      const envContent = `# NextAuth配置
NEXTAUTH_URL=${nextAuthUrl}
NEXTAUTH_SECRET=${crypto.randomBytes(32).toString('base64')}

# 数据库配置
DATABASE_URL="file:./prisma/dev.db"

# 加密密钥（用于加密存储桶密钥）
ENCRYPTION_KEY=${crypto.randomBytes(32).toString('base64')}

# 运行端口
PORT=${port}
`
      
      writeFileSync(envPath, envContent, 'utf8')
      console.log('✅ 环境配置文件已创建')
    }
    
    // 加载环境变量
    require('dotenv').config({ path: '.env.local' })
    
    // 运行 Prisma 数据库推送
    console.log('📝 初始化数据库...')
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' })
      console.log('✅ 数据库初始化完成')
    } catch (error) {
      console.error('❌ 数据库初始化失败:', error.message)
      process.exit(1)
    }
    
    // 初始化 Prisma
    const prisma = new PrismaClient()
    
    // 检查是否已有用户
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      console.log('📝 创建默认管理员账号...')
      
      // 生成随机密码
      const randomPassword = generateRandomPassword()
      const hashedPassword = await bcrypt.hash(randomPassword, 10)
      
      // 创建默认管理员
      await prisma.user.create({
        data: {
          username: 'admin',
          password: hashedPassword,
          isInitialized: true,
        }
      })
      
      console.log('\n' + '='.repeat(50))
      console.log('🎉 CosHub 初始化完成！')
      console.log('='.repeat(50))
      console.log('\n默认管理员账号信息：')
      console.log(`  用户名: admin`)
      console.log(`  密码: ${randomPassword}`)
      console.log('\n⚠️  请妥善保管密码，登录后可在设置中修改')
      console.log('='.repeat(50) + '\n')
    } else {
      console.log('✅ 系统已初始化')
    }
    
    await prisma.$disconnect()
    
    // 显示访问地址
    const port = process.env.PORT || '5030'
    console.log(`\n🌐 访问地址`)
    console.log(`   本地访问: http://localhost:${port}`)
    console.log(`   网络访问: http://${getLocalIP()}:${port}`)
    console.log('\n')
    
  } catch (error) {
    console.error('❌ 初始化失败:', error)
    process.exit(1)
  }
}

// 执行初始化
initializeApp() 