import NextAuth from "next-auth"
import { authOptions } from "@/lib/auth"

// 处理 JWT 错误
const handler = NextAuth({
  ...authOptions,
  logger: {
    error(code, metadata) {
      // 忽略 JWT 解密错误，这通常发生在更换 secret 后
      if (code === "JWT_SESSION_ERROR") {
        console.log("Session expired or invalid, user needs to login again")
        return
      }
      console.error(code, metadata)
    }
  }
})

export { handler as GET, handler as POST } 