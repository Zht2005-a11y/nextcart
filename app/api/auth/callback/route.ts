import { NextResponse } from "next/server"

/**
 * Supabase OAuth 回调。
 * 未配置 Supabase（本地开发模式）时直接跳转首页。
 */
export async function GET(request: Request) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!url) {
    return NextResponse.redirect(new URL("/", request.url))
  }

  const { createServerSupabaseClient } = await import("@/lib/supabase/server")
  const supabase = await createServerSupabaseClient()

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const next = searchParams.get("next") ?? "/"

  if (code && supabase) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`)
}
