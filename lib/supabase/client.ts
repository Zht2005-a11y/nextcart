import { createBrowserClient } from '@supabase/ssr'

/**
 * 浏览器端 Supabase 客户端（客户端组件中使用）。
 * 未配置 NEXT_PUBLIC_SUPABASE_* 时返回 null，调用方应做空值处理（本地开发模式）。
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  return createBrowserClient(url, key)
}
