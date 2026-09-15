import { NextResponse, type NextRequest } from "next/server"

/**
 * 路由保护：
 * - /orders、/checkout 需要登录；
 * - /admin 需要登录且为管理员（管理员校验在 Server Action/页面内做二次确认）。
 * 本地开发模式（无 Supabase）时根据 nextcart-dev-user cookie 判断。
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  const isProtected = ["/orders", "/checkout"].some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  )
  const isAdmin = pathname === "/admin" || pathname.startsWith("/admin/")

  if (!isProtected && !isAdmin) return NextResponse.next()

  // 本地开发模式 cookie
  const devUser = request.cookies.get("nextcart-dev-user")?.value

  if (!devUser) {
    // 尝试 Supabase session
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (url && key) {
      const { createServerClient } = await import("@supabase/ssr")
      const supabase = createServerClient(url, key, {
        cookies: {
          getAll: () => request.cookies.getAll(),
          setAll: () => {},
        },
      })
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        const loginUrl = new URL("/login", request.url)
        loginUrl.searchParams.set("next", pathname)
        return NextResponse.redirect(loginUrl)
      }
    } else {
      const loginUrl = new URL("/login", request.url)
      loginUrl.searchParams.set("next", pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    "/orders/:path*",
    "/checkout/:path*",
    "/admin/:path*",
  ],
}
