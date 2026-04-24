'use client'

import { Badge } from '@/components/ui/badge'

export function DashboardHeader({ 
  profile
}: { 
  profile: any
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between border-b-2 pb-8">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tighter">Olá, {profile.nickname}!</h1>
        <div className="flex items-center gap-2 text-muted-foreground font-medium">
          <Badge variant="secondary" className="text-[10px] font-black uppercase tracking-widest px-3 py-0.5 bg-primary/10 text-primary border-none">
            {profile.role}
          </Badge>
        </div>
      </div>
    </div>
  )
}
