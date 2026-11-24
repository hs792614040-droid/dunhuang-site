import { goods } from './explore'

// 课程商城的示例售价和库存；仅支持本地模拟结算。
const offers = [
  ['flying-bookmark', 29.9, 50], ['silk-scarf', 89, 30],
  ['deer-candle', 59.9, 40], ['color-notebook', 25, 80],
  ['dunhuang-cube', 39.9, 60], ['tassel-bookmark', 19.9, 100]
]
export const shopProducts = goods.map((item, index) => ({
  ...item, id: offers[index][0], price: offers[index][1], stock: offers[index][2]
}))
