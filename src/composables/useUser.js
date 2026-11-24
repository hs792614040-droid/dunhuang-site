import { reactive } from 'vue'

const state = reactive({
  isLoggedIn: localStorage.getItem('isLoggedIn') === 'true',
  username: localStorage.getItem('username') || ''
})

function loadUsers() {
  const saved = localStorage.getItem('users')
  if (saved) {
    try {
      return JSON.parse(saved)
    } catch {
      /* 数据损坏时回退到默认账号 */
    }
  }
  return [{ username: 'admin', password: '123456', nickname: '管理员' }]
}

function saveUsers(users) {
  localStorage.setItem('users', JSON.stringify(users))
}

export function useUser() {
  function login(username, password, remember) {
    const users = loadUsers()
    const user = users.find(u => u.username === username && u.password === password)
    if (!user) {
      return { success: false, message: '用户名或密码错误！' }
    }
    localStorage.setItem('isLoggedIn', 'true')
    localStorage.setItem('username', user.username)
    if (remember) {
      localStorage.setItem('rememberedUser', JSON.stringify({
        username: user.username,
        password: user.password
      }))
    } else {
      localStorage.removeItem('rememberedUser')
    }
    state.isLoggedIn = true
    state.username = user.username
    return { success: true, message: '登录成功！' }
  }

  function register(nickname, username, password) {
    const users = loadUsers()
    if (users.some(u => u.username === username)) {
      return { success: false, message: '用户名已存在！' }
    }
    users.push({ username, password, nickname })
    saveUsers(users)
    return { success: true, message: '注册成功！' }
  }

  function logout() {
    localStorage.removeItem('isLoggedIn')
    localStorage.removeItem('username')
    state.isLoggedIn = false
    state.username = ''
  }

  function rememberedUser() {
    const saved = localStorage.getItem('rememberedUser')
    if (!saved) return null
    try {
      return JSON.parse(saved)
    } catch {
      return null
    }
  }

  return { state, login, register, logout, rememberedUser }
}
