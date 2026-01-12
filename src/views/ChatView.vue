<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chat'

const router = useRouter()
const auth = useAuthStore()
const chat = useChatStore()

const otherUserId = ref<number | null>(null)
const manualConversationId = ref<number | null>(null)
const messageText = ref('')

const title = computed(() => {
  return chat.conversationId ? `Conversation #${chat.conversationId}` : 'No conversation selected'
})

async function createDirect() {
  if (!otherUserId.value) return
  await chat.createDirectConversation(otherUserId.value)
}

async function loadConversation() {
  if (!manualConversationId.value) return
  chat.conversationId = manualConversationId.value
  chat.resetMessages()
  await chat.fetchMessages(manualConversationId.value)
}

async function send() {
  const body = messageText.value.trim()
  if (!body) return
  messageText.value = ''
  await chat.sendMessage(body)
}

function logout() {
  chat.disconnectWebSocket()
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  chat.connectWebSocket()
})

watch(
  () => auth.token,
  (t) => {
    if (t) chat.connectWebSocket()
  }
)
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <header class="sticky top-0 bg-white border-b">
      <div class="mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
        <div>
          <div class="font-semibold">Chat App</div>
          <div class="text-xs text-gray-500">
            WS: <span class="font-medium">{{ chat.wsStatus }}</span>
          </div>
        </div>

        <div class="flex items-center gap-3">
          <div class="text-sm text-gray-600">
            {{ auth.user?.name }} (ID: {{ auth.user?.id }})
          </div>
          <button class="text-sm rounded-lg border px-3 py-1" @click="logout">Logout</button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-4xl px-4 py-6 space-y-4">
      <div class="bg-white border rounded-2xl p-4">
        <div class="font-semibold">{{ title }}</div>

        <div class="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div class="border rounded-xl p-3">
            <div class="text-sm font-medium">Create Direct Conversation</div>
            <div class="text-xs text-gray-500">Masukkan Other User ID (mis: 2)</div>

            <div class="mt-2 flex gap-2">
              <input
                v-model.number="otherUserId"
                type="number"
                class="flex-1 rounded-xl border px-3 py-2"
                placeholder="Other user id"
              />
              <button class="rounded-xl bg-gray-900 text-white px-4" @click="createDirect">
                Create
              </button>
            </div>
          </div>

          <div class="border rounded-xl p-3">
            <div class="text-sm font-medium">Load Existing Conversation</div>
            <div class="text-xs text-gray-500">Masukkan Conversation ID (mis: 10)</div>

            <div class="mt-2 flex gap-2">
              <input
                v-model.number="manualConversationId"
                type="number"
                class="flex-1 rounded-xl border px-3 py-2"
                placeholder="Conversation id"
              />
              <button class="rounded-xl border px-4" @click="loadConversation">Load</button>
            </div>
          </div>
        </div>
      </div>

      <div class="bg-white border rounded-2xl p-4">
        <div class="h-[50vh] overflow-y-auto space-y-2 pr-1">
          <div
            v-for="m in chat.messages"
            :key="m.id"
            class="flex"
            :class="m.sender_id === auth.user?.id ? 'justify-end' : 'justify-start'"
          >
            <div
              class="max-w-[75%] rounded-2xl px-3 py-2 text-sm"
              :class="m.sender_id === auth.user?.id ? 'bg-gray-900 text-white' : 'bg-gray-100'"
            >
              <div class="text-[11px] opacity-70 mb-1">
                sender: {{ m.sender_id }} • #{{ m.id }}
              </div>
              <div>{{ m.body }}</div>
            </div>
          </div>

          <div v-if="chat.loading" class="text-sm text-gray-500">Loading messages...</div>
        </div>

        <form class="mt-3 flex gap-2" @submit.prevent="send">
          <input
            v-model="messageText"
            class="flex-1 rounded-xl border px-3 py-2"
            placeholder="Ketik pesan..."
            :disabled="!chat.conversationId"
          />
          <button
            class="rounded-xl bg-gray-900 text-white px-4 disabled:opacity-50"
            :disabled="!chat.conversationId"
          >
            Send
          </button>
        </form>

        <p v-if="!chat.conversationId" class="text-xs text-gray-500 mt-2">
          Buat / load conversation dulu sebelum mengirim pesan.
        </p>
      </div>
    </main>
  </div>
</template>
