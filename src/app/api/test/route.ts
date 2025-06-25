import { NextResponse } from 'next/server'
import { initializeDatabase } from '@/lib/db'

export async function GET() {
  try {
    const status = await initializeDatabase()
    
    const hasEnvConfig = !!(
      process.env.NEXTAUTH_URL &&
      process.env.NEXTAUTH_SECRET &&
      process.env.ENCRYPTION_KEY
    )
    
    return NextResponse.json({
      status,
      hasEnvConfig,
      env: {
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        hasEncryptionKey: !!process.env.ENCRYPTION_KEY,
        hasDatabaseUrl: !!process.env.DATABASE_URL
      }
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to check status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
} 