<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const auth = useAuthStore()

const email = ref('')
const password = ref('')

async function onSubmit() {
  try {
    await auth.login(email.value.trim(), password.value)
    router.push('/chat')
  } catch {
    // error sudah di-store auth.error
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center px-4">
    <div class="w-full max-w-md rounded-2xl border p-6 shadow-sm bg-white">
      <h1 class="text-2xl font-semibold">Login</h1>
      <p class="text-sm text-gray-500 mt-1">Masuk untuk membuka halaman chat.</p>

      <form class="mt-6 space-y-4" @submit.prevent="onSubmit">
        <div>
          <label class="text-sm font-medium">Email</label>
          <input
            v-model="email"
            type="email"
            class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder="user@mail.com"
            required
          />
        </div>

        <div>
          <label class="text-sm font-medium">Password</label>
          <input
            v-model="password"
            type="password"
            class="mt-1 w-full rounded-xl border px-3 py-2 outline-none focus:ring"
            placeholder="••••••••"
            required
          />
        </div>

        <p v-if="auth.error" class="text-sm text-red-600">
          {{ auth.error }}
        </p>

        <button
          type="submit"
          class="w-full rounded-xl bg-gray-900 text-white py-2 font-medium disabled:opacity-60"
          :disabled="auth.loading"
        >
          {{ auth.loading ? 'Loading...' : 'Login' }}
        </button>

        <div class="text-xs text-gray-500">
          Belum punya user? Register dulu via backend (contoh curl di bawah).
        </div>
      </form>
    </div>
  </div>
</template>
