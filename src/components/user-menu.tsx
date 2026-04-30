'use client'

import { useState } from 'react'
import { Button, buttonVariants } from '@/components/ui/button'
import { Settings, LogOut, LayoutDashboard } from 'lucide-react'
import { signOut } from '@/app/login/actions'
import { cn } from '@/lib/utils'
import Link from 'next/link'

export function UserMenu({ 
  profile
}: { 
  profile: any
}) {
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
