import { redirect } from 'next/navigation'

export default function HomePage() {
  // 中间件会处理重定向逻辑
  // 如果到达这里，说明系统已初始化
  redirect('/login')
}
