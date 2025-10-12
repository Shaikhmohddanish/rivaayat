"use client"

import React from 'react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle2, RefreshCw, Clock } from 'lucide-react'

interface SlugInputProps {
  slug: string
  onChange: (slug: string) => void
  status: 'checking' | 'available' | 'unavailable' | 'error' | 'idle'
  message: string
}

export function SlugInput({ slug, onChange, status, message }: SlugInputProps) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <Label htmlFor="slug">
          Slug * <span className="text-xs text-muted-foreground">(URL-friendly identifier)</span>
        </Label>
        {status !== 'idle' && (
          <SlugStatusBadge status={status} />
        )}
      </div>
      
      <div className="relative">
        <Input
          id="slug"
          value={slug}
          onChange={(e) => onChange(e.target.value)}
          placeholder="product-slug"
          required
          className="pr-12"
        />
        <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
          {status === 'checking' && <Clock className="h-4 w-4 text-muted-foreground animate-pulse" />}
          {status === 'available' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
          {status === 'unavailable' && <AlertCircle className="h-4 w-4 text-red-500" />}
          {status === 'error' && <RefreshCw className="h-4 w-4 text-amber-500" />}
        </div>
      </div>
      
      {message && (
        <p className={`text-xs ${status === 'available' ? 'text-green-600' : status === 'unavailable' ? 'text-red-600' : 'text-muted-foreground'}`}>
          {message}
        </p>
      )}
    </div>
  )
}

function SlugStatusBadge({ status }: { status: string }) {
  switch (status) {
    case 'checking':
      return <Badge variant="outline" className="bg-muted text-muted-foreground">Checking...</Badge>
    case 'available':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Available</Badge>
    case 'unavailable':
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">Unavailable</Badge>
    case 'error':
      return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">Check Failed</Badge>
    default:
      return null
  }
}