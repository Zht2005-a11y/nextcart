export { cn } from "cn"

/** 金额格式化：分 → 元，保留两位小数 */
export function formatPrice(cents: number) {
  return `¥${(cents / 100).toFixed(2)}`
}

/** 生成 UUID（用于幂等键） */
export function uuid() {
  return crypto.randomUUID()
}
