import { PrismaClient } from '@/lib/generated/prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

// Prisma 7 需要 driver adapter 连接 PostgreSQL。
// 本地开发使用 prisma dev 启动的 Prisma Postgres（prisma+postgres://），
// 底层为真实 PostgreSQL，通过 PrismaPg 直连。
function createAdapter() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('缺少 DATABASE_URL 环境变量')

  // prisma+postgres:// → postgres://（PrismaPostgres 本地代理端口 = 主端口，直连端口 = 主端口 + 1）
  if (url.startsWith('prisma+postgres://')) {
    const rest = url.slice('prisma+postgres://'.length)
    const [hostPortPart] = rest.split('?')
    const hostPort = hostPortPart.replace(/\/+$/, '')
    const [host, portStr] = hostPort.split(':')
    const directPort = Number(portStr) + 1
    return new PrismaPg({
      connectionString: `postgres://postgres:postgres@${host}:${directPort}/postgres?sslmode=disable`,
    })
  }

  return new PrismaPg({ connectionString: url })
}

// Next.js 开发环境下热重载会重建模块，需全局缓存单例，避免连接池泄漏
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: createAdapter(),
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export { Prisma } from '@/lib/generated/prisma/client'
export * as Enums from '@/lib/generated/prisma/enums'

