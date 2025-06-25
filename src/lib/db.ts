import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'
import { existsSync } from 'fs'
import { join } from 'path'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 初始化数据库函数
export async function initializeDatabase() {
  try {
    // 检查数据库文件是否存在
    const dbPath = join(process.cwd(), 'prisma', 'dev.db')
    const dbExists = existsSync(dbPath)
    
    if (!dbExists) {
      // 如果数据库不存在，执行prisma db push创建数据库
      try {
        execSync('npx prisma db push --skip-generate', {
          stdio: 'pipe',
          env: process.env
        })
      } catch {
        // 如果命令失败，返回错误
        return { 
          initialized: false, 
          error: 'Failed to create database. Please run "pnpm prisma db push" manually.' 
        }
      }
    }
    
    // 检查是否已初始化
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      // 数据库未初始化
      return { initialized: false }
    }
    
    const user = await prisma.user.findFirst()
    return { initialized: true, isInitialized: user?.isInitialized || false }
  } catch (error) {
    // 如果查询失败，可能是表不存在，尝试创建数据库
    if (error instanceof Error && error.message.includes('does not exist')) {
      try {
        execSync('npx prisma db push --skip-generate', {
          stdio: 'pipe',
          env: process.env
        })
        // 重新检查
        return { initialized: false }
              } catch {
          return { 
            initialized: false, 
            error: 'Failed to create database tables. Please check your database connection.' 
          }
      }
    }
    
    console.error('Database initialization check failed:', error)
    return { initialized: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
} 