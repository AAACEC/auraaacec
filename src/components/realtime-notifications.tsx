'use client'

import { useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

export function RealtimeNotifications({ userId }: { userId: string }) {
  const supabase = createClient()

  useEffect(() => {
    if (!userId) return

    // Request permission for browser notifications
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }

    const channel = supabase
      .channel(`realtime:notifications:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const message = payload.new.message
          
          // Show Toast
          toast.info(message, {
            description: 'Nova notificação recebida'
          })

          // Show Browser Notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("AurAAACEC", {
              body: message,
              icon: "/favicon.ico"
            })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, supabase])

  return null
}
