import { shopProducts } from './shop'
import { news } from './explore'

function readList(key, fallback, isValid) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || 'null')
    return Array.isArray(value) && value.every(isValid) ? value : fallback.map(item => ({ ...item }))
  } catch {
    return fallback.map(item => ({ ...item }))
  }
}

export function loadCatalog() {
  return readList('dunhuang-admin-products-v1', shopProducts, item =>
    item && typeof item.id === 'string' && typeof item.name === 'string' &&
    typeof item.category === 'string' && typeof item.image === 'string' &&
    Number.isFinite(item.price) && item.price >= 0 && Number.isInteger(item.stock) && item.stock >= 0
  )
}

export function saveCatalog(items) {
  localStorage.setItem('dunhuang-admin-products-v1', JSON.stringify(items))
}

export function loadOrders() {
  return readList('dunhuang-shop-orders-v1', [], item =>
    item && typeof item.id === 'string' && typeof item.date === 'string' &&
    Number.isInteger(item.total) && Array.isArray(item.items) &&
    item.items.every(line => line && typeof line.name === 'string' && Number.isInteger(line.quantity))
  )
}

export function saveOrders(items) {
  localStorage.setItem('dunhuang-shop-orders-v1', JSON.stringify(items))
}

export function loadNews() {
  return readList('dunhuang-admin-news-v1', news, item =>
    item && typeof item.title === 'string' && typeof item.category === 'string' &&
    typeof item.text === 'string' && typeof item.url === 'string' &&
    typeof item.image === 'string' && (item.published === undefined || typeof item.published === 'boolean')
  ).map(item => ({ ...item, published: item.published !== false }))
}

export function saveNews(items) {
  localStorage.setItem('dunhuang-admin-news-v1', JSON.stringify(items))
}
