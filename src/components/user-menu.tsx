'use client'

import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Settings, Bell, BellOff, Check, LogOut, LayoutDashboard } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { markNotificationAsRead } from '@/app/dashboard/member-actions'
import { signOut } from '@/app/login/actions'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'
import Link from 'next/link'

export function UserMenu({ 
  profile, 
  notifications = [] 
}: { 
  profile: any, 
  notifications?: any[] 
}) {
  const [notifOpen, setNotifOpen] = useState(false)

  const handleMarkRead = async (id: string) => {
    try {
      await markNotificationAsRead(id)
    } catch (error) {
      toast.error('Erro ao marcar como lida.')
    }
  }

  return (
    <div className="flex items-center gap-2">
      {/* Dashboard Shortcut */}
      <Link 
        href="/dashboard" 
        className={cn(
          buttonVariants({ variant: "ghost", size: "default" }), 
          "flex gap-2 text-primary-foreground hover:bg-white hover:text-primary font-black uppercase tracking-widest text-[11px] transition-colors h-11 px-3 md:px-5 border border-white/20 rounded-xl bg-white/5"
        )}
        title="Dashboard"
      >
        <LayoutDashboard className="h-5 w-5" /> 
        <span className="hidden md:inline">Dashboard</span>
      </Link>

      {/* Notification Center */}
      <Dialog open={notifOpen} onOpenChange={setNotifOpen}>
        <DialogTrigger className="relative flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-primary-foreground hover:bg-white hover:text-primary transition-colors outline-none focus-visible:ring-1 focus-visible:ring-white">
          <Bell className="h-4 w-4" />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] font-black text-primary shadow-sm animate-pulse">
              {notifications.length}
            </span>
          )}
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-primary font-bold">
              <Bell className="h-5 w-5" /> Notificações
            </DialogTitle>
            <DialogDescription className="font-medium text-xs">
              Fique por dentro das atualizações de suas tasks.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4 max-h-[300px] overflow-y-auto pr-2">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div key={n.id} className="group relative flex items-start gap-3 rounded-xl border-2 p-4 hover:bg-muted/50 transition-colors bg-card shadow-sm">
                  <div className="flex-1 space-y-1">
                    <p className="text-base font-medium leading-tight">{n.message}</p>
                    <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">
                      {new Date(n.createdAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                  <button 
                    onClick={() => handleMarkRead(n.id)}
                    className="shrink-0 rounded-full p-2 hover:bg-green-100 text-muted-foreground hover:text-green-700 transition-colors"
                    title="Marcar como lida"
                  >
                    <Check className="h-5 w-5" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground space-y-3">
                <BellOff className="h-10 w-10 opacity-10" />
                <p className="text-sm font-medium italic">Nenhuma notificação nova.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Profile Settings Link */}
      <Link 
        href="/dashboard/settings" 
        className={cn(
          buttonVariants({ variant: "ghost", size: "icon" }), 
          "rounded-full border border-white/20 bg-white/10 text-primary-foreground hover:bg-white hover:text-primary transition-colors"
        )}
        title="Configurações"
      >
        <Settings className="h-4 w-4" />
      </Link>

      {/* Logout Button */}
      <Button 
        variant="ghost" 
        size="icon" 
        onClick={() => signOut()} 
        className="rounded-full text-white/70 hover:bg-white hover:text-primary transition-colors" 
        title="Sair"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  )
}
