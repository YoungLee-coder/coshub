import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// 初始化数据库函数
export async function initializeDatabase() {
  try {
    // 检查是否已初始化
    const userCount = await prisma.user.count()
    
    if (userCount === 0) {
      // 数据库未初始化
      return { initialized: false }
    }
    
    const user = await prisma.user.findFirst()
    return { initialized: true, isInitialized: user?.isInitialized || false }
  } catch (error) {
    console.error('Database initialization check failed:', error)
    return { initialized: false, error: error instanceof Error ? error.message : 'Unknown error' }
  }
} 