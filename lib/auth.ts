import 'server-only'

import { Prisma, Enums, prisma } from '@/lib/prisma'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export type DbUser = Prisma.UserModel

export class AuthError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AuthError'
  }
}

/**
 * 获取当前登录用户（返回 Prisma User，含 role 等）。
 *
 * 两种模式：
 * 1. 配置了 Supabase（NEXT_PUBLIC_SUPABASE_URL）→ 以 Supabase Auth 会话为准；
 * 2. 未配置 Supabase（本地开发模式）→ 读取 `nextcart-dev-user` cookie（actions/auth.ts
 *    的内置账号写入），按该 id 查 Prisma User。
 *
 * 两种模式下 Prisma User.id 都等于认证层用户 id。
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()

  let authUserId: string | null = null
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser()
    authUserId = user?.id ?? null
  } else {
    const { cookies } = await import('next/headers')
    const store = await cookies()
    authUserId = store.get('nextcart-dev-user')?.value ?? null
  }

  if (!authUserId) return null

  return prisma.user.findUnique({
    where: { id: authUserId },
  })
}

export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) {
    throw new AuthError('未登录')
  }
  return user
}

export async function requireAdmin() {
  const user = await requireUser()
  if (user.role !== Enums.Role.ADMIN) {
    throw new AuthError('无权限：需要管理员')
  }
  return user
}
