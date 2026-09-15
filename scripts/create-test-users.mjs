import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client.js"
import { PrismaPg } from "@prisma/adapter-pg"

const url = process.env.DATABASE_URL
const rest = url.slice("prisma+postgres://".length).split("?")[0].replace(/\/+$/, "")
const [h, p] = rest.split(":")
const adapter = new PrismaPg({
  connectionString: `postgres://postgres:postgres@${h}:${Number(p) + 1}/postgres?sslmode=disable`,
})
const prisma = new PrismaClient({ adapter })

await prisma.user.upsert({
  where: { id: "dev:alice@example.com" },
  update: {},
  create: { id: "dev:alice@example.com", email: "alice@example.com", name: "测试用户", role: "USER", passwordHash: "x" },
})
await prisma.user.upsert({
  where: { id: "dev:admin@example.com" },
  update: {},
  create: { id: "dev:admin@example.com", email: "admin@example.com", name: "管理员", role: "ADMIN", passwordHash: "x" },
})
const users = await prisma.user.findMany()
console.log("users:", users.map((u) => `${u.id}:${u.role}`).join(", "))
await prisma.$disconnect()
