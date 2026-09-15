import Stripe from 'stripe'

let stripe: Stripe | null = null

/**
 * Stripe 客户端单例。
 * 测试模式 key（sk_test_ / pk_test_）见 .env.example；
 * 本地联调 Webhook 可用 `stripe listen --forward-to localhost:3000/api/webhooks/stripe`。
 */
export function getStripe() {
  if (!stripe) {
    const key = process.env.STRIPE_SECRET_KEY
    if (!key) {
      throw new Error('缺少 STRIPE_SECRET_KEY 环境变量')
    }
    stripe = new Stripe(key, {
      typescript: true,
      apiVersion: '2026-08-26.dahlia',
    })
  }
  return stripe
}
