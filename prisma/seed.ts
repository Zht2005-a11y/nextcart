import "dotenv/config"
import { PrismaClient } from "@/lib/generated/prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"

function createAdapter() {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error("缺少 DATABASE_URL 环境变量")

  if (url.startsWith("prisma+postgres://")) {
    const rest = url.slice("prisma+postgres://".length)
    const [hostPortPart] = rest.split("?")
    const hostPort = hostPortPart.replace(/\/+$/, "")
    const [host, portStr] = hostPort.split(":")
    const directPort = Number(portStr) + 1
    return new PrismaPg({
      connectionString: `postgres://postgres:postgres@${host}:${directPort}/postgres?sslmode=disable`,
    })
  }

  return new PrismaPg({ connectionString: url })
}

const prisma = new PrismaClient({ adapter: createAdapter() })

async function main() {
  // ---------- 分类 ----------
  const categories = [
    { name: "数码配件", slug: "digital-accessories" },
    { name: "音频设备", slug: "audio" },
    { name: "智能穿戴", slug: "wearables" },
    { name: "家居生活", slug: "home-living" },
  ]

  const categoryMap: Record<string, string> = {}
  for (const c of categories) {
    const upserted = await prisma.category.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    })
    categoryMap[c.slug] = upserted.id
  }

  // ---------- 商品 ----------
  const products = [
    {
      name: "无线降噪耳机",
      slug: "wireless-earphones",
      description: "主动降噪蓝牙耳机，30 小时续航，支持快充，佩戴轻盈舒适。\n\n· 主动降噪 ANC\n· 蓝牙 5.3 稳定连接\n· 30 小时综合续航\n· IPX4 防水",
      price: 29900,
      stock: 100,
      category: "digital-accessories",
      images: ["/images/earphones.svg"],
    },
    {
      name: "RGB 机械键盘",
      slug: "mechanical-keyboard",
      description: "全键热插拔机械键盘，RGB 背光，PBT 键帽，支持有线/无线双模。\n\n· 红轴线性手感\n· 全键无冲\n· 4000mAh 电池",
      price: 49900,
      stock: 50,
      category: "digital-accessories",
      images: ["/images/keyboard.svg"],
    },
    {
      name: "智能手表 Pro",
      slug: "smart-watch-pro",
      description: "AMOLED 高清屏，血氧/心率监测，100+ 运动模式，14 天长续航。\n\n· 1.43 英寸 AMOLED\n· 双频 GPS\n· 5ATM 防水",
      price: 129900,
      stock: 30,
      category: "wearables",
      images: ["/images/watch.svg"],
    },
    {
      name: "便携蓝牙音箱",
      slug: "bluetooth-speaker",
      description: "360° 环绕立体声，IP67 防尘防水，24 小时续航，支持 TWS 组队。\n\n· 20W 功率\n· 低音增强\n· Type-C 快充",
      price: 39900,
      stock: 80,
      category: "audio",
      images: ["/images/speaker.svg"],
    },
    {
      name: "微单数码相机",
      slug: "mirrorless-camera",
      description: "APS-C 画幅，4K 60fps 视频，五轴防抖，轻巧便携。\n\n· 2600 万像素\n· 眼部对焦\n· 触摸翻转屏",
      price: 549900,
      stock: 10,
      category: "digital-accessories",
      images: ["/images/camera.svg"],
    },
    {
      name: "护眼台灯",
      slug: "eye-care-lamp",
      description: "无频闪护眼照明，Ra98 高显色，色温亮度无级调节，智能感应。\n\n· 国 AA 级照度\n· 自动调光\n· 简约设计",
      price: 25900,
      stock: 120,
      category: "home-living",
      images: ["/images/lamp.svg"],
    },
    {
      name: "头戴式监听耳机",
      slug: "over-ear-headset",
      description: "封闭式监听耳机，Hi-Res 认证，可折叠设计，适合录音棚与日常使用。\n\n· 50mm 动圈单元\n· 可换线设计\n· 附收纳包",
      price: 89900,
      stock: 40,
      category: "audio",
      images: ["/images/headset.svg"],
    },
    {
      name: "人体工学椅",
      slug: "ergonomic-chair",
      description: "全网布透气椅背，4D 扶手，可调腰托与头枕，久坐不累。\n\n· 140° 后仰\n· 气杆认证\n· 承重 150kg",
      price: 159900,
      stock: 15,
      category: "home-living",
      images: ["/images/chair.svg"],
    },
  ]

  for (const p of products) {
    await prisma.product.upsert({
      where: { slug: p.slug },
      update: {
        name: p.name,
        description: p.description,
        price: p.price,
        stock: p.stock,
        categoryId: categoryMap[p.category],
        images: p.images,
        active: true,
      },
      create: {
        name: p.name,
        slug: p.slug,
        description: p.description,
        price: p.price,
        stock: p.stock,
        categoryId: categoryMap[p.category],
        images: p.images,
        active: true,
      },
    })
  }

  console.log("✅ 种子数据完成：4 个分类，8 件商品")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
