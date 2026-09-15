import { z } from 'zod'

export const authSchemas = {
  signIn: z.object({
    email: z.string().email('请输入有效的邮箱'),
    password: z.string().min(8, '密码至少 8 位'),
  }),
  signUp: z.object({
    email: z.string().email('请输入有效的邮箱'),
    password: z.string().min(8, '密码至少 8 位'),
    name: z.string().min(1, '请输入昵称').max(50),
  }),
} as const

export const addressSchema = z.object({
  name: z.string().min(1, '请填写收件人'),
  phone: z.string().min(5, '请填写手机号'),
  province: z.string().min(1, '请选择省'),
  city: z.string().min(1, '请选择市'),
  district: z.string().min(1, '请选择区/县'),
  detail: z.string().min(1, '请填写详细地址'),
  isDefault: z.boolean().default(false),
})

export const createOrderSchema = z.object({
  addressId: z.string().min(1, '请选择收货地址'),
  idempotencyKey: z.string().uuid('幂等键必须为 UUID'),
})

export const productInputSchema = z.object({
  name: z.string().min(1, '请填写商品名称'),
  slug: z
    .string()
    .min(2, 'slug 至少 2 个字符')
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug 仅允许小写字母、数字与连字符'),
  description: z.string().max(5000).optional().or(z.literal('')),
  price: z.coerce
    .number({ message: '价格必须为数字' })
    .int('价格必须为整数')
    .nonnegative('价格不能为负'),
  stock: z.coerce
    .number({ message: '库存必须为数字' })
    .int('库存必须为整数')
    .nonnegative('库存不能为负'),
  categoryId: z.string().min(1, '请选择分类').or(z.literal('')),
  images: z.array(z.string()).default([]),
  active: z.boolean().default(true),
})

export const updateProductSchema = productInputSchema.partial()

export type AddressInput = z.infer<typeof addressSchema>
export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type ProductInput = z.infer<typeof productInputSchema>
