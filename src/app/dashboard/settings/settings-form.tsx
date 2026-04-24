'use client'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { updateProfile } from '../member-actions'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Loader2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export function SettingsForm({ profile }: { profile: any }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const handleUpdate = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await updateProfile(formData)
        toast.success('Perfil atualizado!')
        router.refresh()
      } catch (error) {
        toast.error('Erro ao atualizar perfil.')
      }
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-4xl font-extrabold tracking-tighter text-primary uppercase">Configurações</h1>
        <p className="text-muted-foreground text-sm font-medium">
          Atualize suas informações e preferências.
        </p>
      </div>

      <Card className="border-2 shadow-sm rounded-2xl overflow-hidden">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold">Seu Perfil</CardTitle>
          <CardDescription className="font-medium text-xs">
            Como suas informações aparecem para a gestão.
          </CardDescription>
        </CardHeader>
        <form action={handleUpdate}>
          <CardContent className="space-y-6 pt-8 pb-10 flex-1">
            <div className="grid gap-2">
              <Label htmlFor="nickname" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Apelido</Label>
              <Input id="nickname" name="nickname" defaultValue={profile.nickname} required className="h-11 rounded-xl border-2" />
              <p className="text-[10px] text-muted-foreground font-medium px-1">Como seu nome aparecerá para os outros integrantes.</p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="course" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Curso</Label>
              <Input id="course" name="course" defaultValue={profile.course} required className="h-11 rounded-xl border-2" />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="favoriteSong" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Música Favorita do 100Nossão</Label>
              <Input id="favoriteSong" name="favoriteSong" defaultValue={profile.favoriteSong || ''} className="h-11 rounded-xl border-2" />
              <p className="text-[10px] text-muted-foreground font-medium px-1">Uma curiosidade para o seu perfil público.</p>
            </div>
          </CardContent>
          <div className="px-6 pb-10 flex justify-end">
            <Button 
              type="submit" 
              disabled={isPending}
              className="px-10 h-12 rounded-xl font-black uppercase tracking-widest active:scale-95 transition-all shadow-md"
            >
              {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  )
}
