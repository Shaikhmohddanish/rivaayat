"use client"

import { useState, useEffect } from "react"
import { formatDateTimeIST } from "@/lib/date-utils"

interface ISTClockProps {
  className?: string
  showSeconds?: boolean
}

export function ISTClock({ className = "", showSeconds = false }: ISTClockProps) {
  const [currentTime, setCurrentTime] = useState<Date>(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, showSeconds ? 1000 : 60000) // Update every second if showing seconds, otherwise every minute

    return () => clearInterval(timer)
  }, [showSeconds])

  const formatTime = (date: Date) => {
    if (showSeconds) {
      return new Intl.DateTimeFormat('en-GB', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      }).format(date)
    }
    return new Intl.DateTimeFormat('en-GB', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata'
    }).format(date)
  }

  return (
    <div className={className}>
      <span className="text-sm text-muted-foreground">
        IST: {formatTime(currentTime)}
      </span>
    </div>
  )
}