'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { 
  Home, 
  Settings, 
  LogOut,
  FolderOpen
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const navItems = [
  {
    title: '文件管理',
    href: '/dashboard',
    icon: Home,
  },
  {
    title: '存储桶设置',
    href: '/dashboard/settings',
    icon: Settings,
  },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  
  const handleLogout = async () => {
    try {
      // 使用相对路径，避免硬编码域名
      const data = await signOut({ 
        redirect: false,
        callbackUrl: '/login' 
      })
      
      // 手动处理重定向，确保使用正确的路径
      router.push(data.url || '/login')
    } catch (error) {
      console.error('Logout error:', error)
      // 如果退出失败，仍然重定向到登录页
      router.push('/login')
    }
  }
  
  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <div className="w-64 bg-card border-r flex flex-col">
        <div className="p-6 flex-1">
          <div className="flex items-center gap-2 mb-8">
            <FolderOpen className="h-6 w-6" />
            <h1 className="text-xl font-bold">CosHub</h1>
          </div>
          
          <nav className="space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  pathname === item.href
                    ? "bg-secondary text-secondary-foreground"
                    : "hover:bg-secondary/50"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.title}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="p-6">
          <Button
            variant="outline"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="h-4 w-4 mr-2" />
            退出登录
          </Button>
        </div>
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
} 