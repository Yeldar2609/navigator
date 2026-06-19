import { z } from 'zod'

export const chatMessageSchema = z.object({
  threadId: z.string().uuid().optional(),
  message: z.string().min(1, 'Type a message').max(2000),
})

export type ChatMessageInput = z.infer<typeof chatMessageSchema>
