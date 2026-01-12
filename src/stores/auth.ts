import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import type { User } from '@/types/chat'

export const useAuthStore = defineStore('auth', () => {
  const token = ref<string>(localStorage.getItem('access_token') || '')
  const user = ref<User | null>(
    localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user') as string) : null
  )
  const loading = ref(false)
  const error = ref<string | null>(null)

  const isAuthenticated = computed(() => !!token.value)

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    try {
      const res = await api.post('/auth/login', { email, password })
      token.value = res.data.access_token
      user.value = res.data.user

      localStorage.setItem('access_token', token.value)
      localStorage.setItem('user', JSON.stringify(user.value))
    } catch (e: any) {
      error.value = e?.response?.data?.message || e?.message || 'Login failed'
      throw e
    } finally {
      loading.value = false
    }
  }

  function logout() {
    token.value = ''
    user.value = null
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
  }

  return { token, user, loading, error, isAuthenticated, login, logout }
})
