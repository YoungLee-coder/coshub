'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
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
  
  const handleLogout = async () => {
    await signOut({ callbackUrl: '/login' })
  }
  
  return (
    <div className="min-h-screen flex">
      {/* 侧边栏 */}
      <div className="w-64 bg-card border-r">
        <div className="p-6">
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
          
          <div className="absolute bottom-6 left-6 right-6">
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
      </div>
      
      {/* 主内容区 */}
      <div className="flex-1 overflow-hidden">
        {children}
      </div>
    </div>
  )
} 