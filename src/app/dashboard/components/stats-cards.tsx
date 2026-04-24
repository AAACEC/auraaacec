import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Trophy, CheckCircle2, Timer } from 'lucide-react'

export function StatsCards({ profile, userSubmissions }: { profile: any, userSubmissions: any[] }) {
  const approvedCount = userSubmissions.filter((s) => s.validationStatus === 'Aprovada').length
  const pendingCount = userSubmissions.filter((s) => s.validationStatus === 'Pendente').length

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-2 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aura Total</CardTitle>
          <Trophy className="h-4 w-4 text-primary" />
        </CardHeader>
        <CardContent className="pt-6 pb-8 flex-1 flex items-end">
          <div className="text-4xl font-black text-primary tracking-tighter">{profile.accumulatedAura}</div>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Concluídas</CardTitle>
          <CheckCircle2 className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent className="pt-6 pb-8 flex-1 flex items-end">
          <div className="text-4xl font-black tracking-tighter">{approvedCount}</div>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pendentes</CardTitle>
          <Timer className="h-4 w-4 text-yellow-600" />
        </CardHeader>
        <CardContent className="pt-6 pb-8 flex-1 flex items-end">
          <div className="text-4xl font-black tracking-tighter">{pendingCount}</div>
        </CardContent>
      </Card>
    </div>
  )
}
