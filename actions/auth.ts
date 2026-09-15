'use server'

import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import { authSchemas } from '@/lib/validations'

const DEV_SESSION_COOKIE = 'nextcart-dev-user'

export type ActionState = { error?: string }

/**
 * 注册。
 * - Supabase 模式（配置了 NEXT_PUBLIC_SUPABASE_URL）：走 Supabase Auth，成功后同步 Prisma User；
 * - 本地开发模式：直接写 Prisma User（首个用户为 ADMIN），密码以 SHA-256 存 passwordHash。
 */
export async function signUp(input: unknown, state?: ActionState): Promise<ActionState | undefined> {
  const parsed = authSchemas.signUp.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '输入有误' }
  }
  const { email, password, name } = parsed.data

  const { createServerSupabaseClient } = await import('@/lib/supabase/server')
  const supabase = await createServerSupabaseClient()

  if (supabase) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })
    if (error) return { error: error.message }

    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await prisma.user.upsert({
        where: { id: user.id },
        update: {},
        create: {
          id: user.id,
          email: user.email ?? email,
          name: (user.user_metadata?.name as string) ?? name,
          role: 'USER',
        },
      })
    }
    redirect('/login')
  }

  // ---- 本地开发模式 ----
  const userId = devUserIdFor(email)
  const existing = await prisma.user.findUnique({ where: { id: userId } })
  if (existing) return { error: '该邮箱已注册' }

  const userCount = await prisma.user.count()
  await prisma.user.create({
    data: {
      id: userId,
      email,
      name,
      role: userCount === 0 ? 'ADMIN' : 'USER',
      passwordHash: await sha256hex(`${email.toLowerCase()}#${password}`),
    },
  })

  const store = await cookies()
  store.set(DEV_SESSION_COOKIE, userId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })

  revalidatePath('/', 'layout')
  return undefined
}

export async function signIn(input: unknown, state?: ActionState): Promise<ActionState | undefined> {
  const parsed = authSchemas.signIn.safeParse(input)
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? '输入有误' }
  }
  const { email, password } = parsed.data

  const { createServerSupabaseClient } = await import('@/lib/supabase/server')
  const supabase = await createServerSupabaseClient()

  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: '邮箱或密码不正确' }
    redirect('/')
  }

  // ---- 本地开发模式 ----
  const userId = devUserIdFor(email)
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) return { error: '用户不存在，请先注册' }

  const expected = user.passwordHash
  if (!expected) return { error: '密码缺失（请重新注册）' }
  const actual = await sha256hex(`${email.toLowerCase()}#${password}`)
  if (expected !== actual) return { error: '邮箱或密码不正确' }

  const store = await cookies()
  store.set(DEV_SESSION_COOKIE, userId, {
    path: '/',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30,
  })

  revalidatePath('/', 'layout')
  return undefined
}

export async function signOut() {
  const { createServerSupabaseClient } = await import('@/lib/supabase/server')
  const supabase = await createServerSupabaseClient()
  if (supabase) await supabase.auth.signOut()

  const store = await cookies()
  store.delete(DEV_SESSION_COOKIE)
  revalidatePath('/', 'layout')
  redirect('/login')
}

// ---------- 内部工具 ----------

function devUserIdFor(email: string) {
  return `dev:${email.toLowerCase()}`
}

/** 纯 JS SHA-256（仅用于本地开发模式的密码哈希，不进生产链路） */
async function sha256hex(input: string) {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(input))
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}
