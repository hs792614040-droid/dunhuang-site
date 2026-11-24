const appTabs = ['home', 'discover', 'exhibit', 'mine']

export function isAppTab(value) {
  return appTabs.includes(value)
}

export function appTabLocation(tab, query = {}) {
  return { name: 'app', query: tab === 'home' ? {} : { ...query, tab } }
}

export function appReturnLocation(query) {
  if (!isAppTab(query.appTab)) return null
  const search = query.appTab === 'discover' ? { q: query.appQ, filter: query.appFilter } : {}
  return appTabLocation(query.appTab, search)
}
