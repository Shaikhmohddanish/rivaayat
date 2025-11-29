import type React from "react"

interface WhatsAppFloatingButtonProps {
  phoneNumber?: string
  helperText?: string
  defaultMessage?: string
  enabled?: boolean
}

function WhatsAppIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" {...props}>
      <path d="M16.002 3C9.388 3 4 8.342 4 14.905c0 2.596.92 5.008 2.455 6.953L4 29l7.476-2.353a12.67 12.67 0 0 0 4.526.84c6.614 0 12.003-5.342 12.003-11.905S22.616 3 16.002 3Zm0 2.4c5.3 0 9.602 4.18 9.602 9.505s-4.302 9.504-9.602 9.504a9.23 9.23 0 0 1-4.292-1.02l-.3-.152L7 24.52l1.442-4.15-.196-.32a9.8 9.8 0 0 1-1.946-6.144c0-5.324 4.302-9.505 9.702-9.505Zm-4.322 4.09c-.15 0-.34.012-.55.18-.21.168-.77.676-.77 1.632 0 .956.7 1.884.8 2.012.1.128 1.49 2.44 3.676 3.312 2.186.872 2.18.604 2.566.572.386-.032 1.252-.516 1.43-1.016.178-.5.178-.924.126-1.012-.052-.088-.194-.144-.408-.252-.214-.108-1.26-.62-1.454-.692-.194-.072-.336-.108-.48.108-.144.216-.547.696-.672.84-.124.144-.25.162-.464.054-.214-.108-.904-.344-1.73-1.104-.64-.592-1.074-1.324-1.2-1.548-.126-.224-.012-.344.094-.456.1-.112.214-.256.322-.384.108-.128.144-.22.216-.368.072-.148.036-.276-.018-.388-.054-.112-.478-1.22-.658-1.672-.18-.452-.342-.416-.486-.424-.144-.008-.3-.012-.45-.012Z" />
    </svg>
  )
}

export function WhatsAppFloatingButton({ phoneNumber, helperText, defaultMessage, enabled = true }: WhatsAppFloatingButtonProps) {
  if (!enabled) return null

  const sanitizedNumber = (phoneNumber || "918097787110").replace(/[^\d]/g, "")
  if (!sanitizedNumber) return null

  const prefilledMessage = defaultMessage?.trim() || "Hi Rivaayat team, I'd love to chat!"
  const supportText = helperText || "Need help styling your look?"
  const whatsappHref = `https://wa.me/${sanitizedNumber}?text=${encodeURIComponent(prefilledMessage)}`

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-[60] flex flex-col items-end gap-2 pointer-events-none">
      {supportText && (
        <span className="hidden md:inline-flex items-center rounded-2xl border bg-background/90 px-4 py-2 text-sm font-medium shadow-lg pointer-events-auto">
          {supportText}
        </span>
      )}
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        className="pointer-events-auto inline-flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-2 text-sm font-semibold text-white shadow-xl transition hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#25D366]"
        aria-label="Chat with Rivaayat on WhatsApp"
      >
        <WhatsAppIcon className="h-5 w-5" />
        <span className="hidden sm:inline">Chat on WhatsApp</span>
      </a>
    </div>
  )
}
