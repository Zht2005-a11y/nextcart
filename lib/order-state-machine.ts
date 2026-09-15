import { Enums } from '@/lib/prisma'

type OrderStatus = Enums.OrderStatus

/**
 * 订单状态机：集中管理合法的状态转换。
 * 任何状态变更必须经过 transitionOrder 单一入口，并写 OrderStatusLog。
 */
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'CANCELLED'],
  PAID: ['SHIPPED', 'REFUNDING'],
  SHIPPED: ['COMPLETED'],
  COMPLETED: [],
  CANCELLED: [],
  REFUNDING: ['REFUNDED', 'PAID'],
  REFUNDED: [],
}

export class IllegalTransitionError extends Error {
  constructor(from: OrderStatus, to: OrderStatus) {
    super(`非法状态转换: ${from} -> ${to}`)
    this.name = 'IllegalTransitionError'
  }
}

export function assertTransition(from: OrderStatus, to: OrderStatus) {
  if (!allowedTransitions[from].includes(to)) {
    throw new IllegalTransitionError(from, to)
  }
}

export function canTransition(from: OrderStatus, to: OrderStatus) {
  return allowedTransitions[from].includes(to)
}

/** 可读的中文状态名，用于界面展示 */
export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  PENDING_PAYMENT: '待付款',
  PAID: '已付款',
  SHIPPED: '已发货',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
}
