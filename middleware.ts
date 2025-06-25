import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        // 检查路径
        const pathname = req.nextUrl.pathname
        
        // 这些路径不需要认证
        const publicPaths = ['/login', '/initialize', '/api/auth', '/']
        
        // 检查是否是公开路径
        const isPublicPath = publicPaths.some(path => pathname.startsWith(path))
        
        if (isPublicPath) {
          return true
        }
        
        // 其他路径需要token
        return !!token
      }
    },
    pages: {
      signIn: '/login',
    }
  }
)

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ]
} 