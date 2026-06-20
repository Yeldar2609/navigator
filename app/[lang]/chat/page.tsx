import { resolveLocale } from '@/lib/i18n/config'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isAiCounselorConfigured } from '@/lib/env'
import { AppShell } from '@/components/layout/app-shell'
import { ChatView } from '@/components/chat/chat-view'

export default function ChatPage({ params }: { params: { lang: string } }) {
  const locale = resolveLocale(params.lang)
  const dict = getDictionary(locale)
  // Gate the interactive AI chat on the configured flag. When the AI counselor
  // is not configured (no Dialogflow CX agent), ChatView renders a clear
  // "coming soon" panel instead of a fake AI conversation.
  const aiEnabled = isAiCounselorConfigured()
  return (
    <AppShell locale={locale} dict={dict}>
      <ChatView locale={locale} dict={dict} aiEnabled={aiEnabled} />
    </AppShell>
  )
}
