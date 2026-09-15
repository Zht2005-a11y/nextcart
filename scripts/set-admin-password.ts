import "dotenv/config"
import { createHash } from "node:crypto"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

async function main() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("缺少 DATABASE_URL")
  const rest = url.slice("prisma+postgres://".length).split("?")[0].replace(/\/+$/, "")
  const [h, p] = rest.split(":")
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: `postgres://postgres:postgres@${h}:${Number(p) + 1}/postgres?sslmode=disable`,
    }),
  })

  const hash = createHash("sha256")
    .update("admin@example.com#adminpass123")
    .digest("hex")

  await prisma.user.update({
    where: { id: "dev:admin@example.com" },
    data: { passwordHash: hash },
  })
  console.log("admin passwordHash set OK")
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
