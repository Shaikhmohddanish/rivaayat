"use client"

import { useState, useEffect } from "react"
import { useMemo } from "react"

interface ISTClockProps {
  className?: string
  showSeconds?: boolean
}

export function ISTClock({ className = "", showSeconds = false }: ISTClockProps) {
  const [currentTime, setCurrentTime] = useState<Date | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  const formatter = useMemo(
    () =>
      new Intl.DateTimeFormat("en-GB", {
        hour: "2-digit",
        minute: "2-digit",
        ...(showSeconds ? { second: "2-digit" } : {}),
        hour12: true,
        timeZone: "Asia/Kolkata",
      }),
    [showSeconds],
  )

  useEffect(() => {
    // Set mounted state to prevent hydration mismatch
    setIsMounted(true)
    setCurrentTime(new Date())

    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, showSeconds ? 1000 : 60000) // Update every second if showing seconds, otherwise every minute

    return () => clearInterval(timer)
  }, [showSeconds])

  // Don't render anything until mounted on client to avoid hydration mismatch
  if (!isMounted || !currentTime) {
    return (
      <div className={className}>
        <span className="text-sm text-muted-foreground">
          IST: --:--
        </span>
      </div>
    )
  }

  return (
    <div className={className}>
      <span className="text-sm text-muted-foreground">
        IST: {formatter.format(currentTime)}
      </span>
    </div>
  )
}