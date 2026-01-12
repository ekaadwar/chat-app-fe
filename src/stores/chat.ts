import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import api from '@/services/api'
import type { Message, WsEvent } from '@/types/chat'
import { useAuthStore } from './auth'

export const useChatStore = defineStore('chat', () => {
  const auth = useAuthStore()

  const conversationId = ref<number | null>(null)
  const messages = ref<Message[]>([])
  const loading = ref(false)
  const wsStatus = ref<'disconnected' | 'connecting' | 'connected'>('disconnected')

  let ws: WebSocket | null = null
  const knownMessageIds = new Set<number>()

  const meId = computed(() => auth.user?.id ?? 0)

  function resetMessages() {
    messages.value = []
    knownMessageIds.clear()
  }

  async function createDirectConversation(otherUserId: number) {
    const res = await api.post('/conversations/direct', { other_user_id: otherUserId })
    conversationId.value = res.data.conversation_id
    resetMessages()
    await fetchMessages(conversationId.value)
    return conversationId.value
  }

  async function fetchMessages(convId: number) {
    loading.value = true
    try {
      const res = await api.get(`/conversations/${convId}/messages`, {
        params: { limit: 50 },
      })
      const data: Message[] = res.data.data || []
      messages.value = data
      for (const m of data) knownMessageIds.add(m.id)
    } finally {
      loading.value = false
    }
  }

  async function sendMessage(body: string) {
    if (!conversationId.value) throw new Error('conversationId is not set')
    const res = await api.post(`/conversations/${conversationId.value}/messages`, { body })
    const msg: Message = res.data.data
    // Optimistic push (hindari delay). Dedup saat WS datang.
    pushMessageIfNew(msg)
  }

  function pushMessageIfNew(msg: Message) {
    if (knownMessageIds.has(msg.id)) return
    knownMessageIds.add(msg.id)
    messages.value = [...messages.value, msg]
  }

  function connectWebSocket() {
    const token = auth.token
    if (!token) return

    // connect ke origin FE (5173), lalu diproxy ke backend lewat vite proxy
    const proto = location.protocol === 'https:' ? 'wss' : 'ws'
    const wsPath = import.meta.env.VITE_WS_PATH || '/ws'
    const url = `${proto}://${location.host}${wsPath}?token=${encodeURIComponent(token)}`

    // cleanup
    disconnectWebSocket()

    wsStatus.value = 'connecting'
    ws = new WebSocket(url)

    ws.onopen = () => {
      wsStatus.value = 'connected'
    }

    ws.onclose = () => {
      wsStatus.value = 'disconnected'
      // auto reconnect sederhana
      setTimeout(() => {
        if (auth.token) connectWebSocket()
      }, 1000)
    }

    ws.onerror = () => {
      wsStatus.value = 'disconnected'
    }

    ws.onmessage = (ev) => {
      try {
        const payload = JSON.parse(ev.data) as WsEvent
        if (payload.type === 'message:new') {
          const msg = payload.data
          // tampilkan hanya kalau conversation yang sedang dibuka
          if (!conversationId.value || msg.conversation_id !== conversationId.value) return
          pushMessageIfNew(msg)
        }
      } catch {
        // ignore invalid json
      }
    }
  }

  function disconnectWebSocket() {
    if (ws) {
      try {
        ws.close()
      } catch {}
      ws = null
    }
    wsStatus.value = 'disconnected'
  }

  return {
    meId,
    conversationId,
    messages,
    loading,
    wsStatus,
    createDirectConversation,
    fetchMessages,
    sendMessage,
    connectWebSocket,
    disconnectWebSocket,
    resetMessages,
  }
})
