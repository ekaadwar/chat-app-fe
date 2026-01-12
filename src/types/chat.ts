export type User = {
  id: number
  name: string
  email: string
}

export type Message = {
  id: number
  conversation_id: number
  sender_id: number
  body: string
  created_at: string
}

export type WsEvent =
  | { type: 'message:new'; data: Message }
  | { type: string; data: any }
