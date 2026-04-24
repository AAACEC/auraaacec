import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { OnboardingForm } from './onboarding-form'

export default async function OnboardingPage() {
  const supabase = await createClient()

  // Verify the user is authenticated but doesn't have a profile yet
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Obter o nome e email padrão do Google (opcional) para pré-preencher
  const defaultFullName = user.user_metadata?.full_name || ''

  return (
    <div className="container mx-auto px-4 flex h-[calc(100vh-4rem)] flex-col items-center justify-center py-10">
      <div className="mx-auto flex w-full max-w-[500px] flex-col justify-center space-y-6">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">Complete seu Perfil</h1>
          <p className="text-muted-foreground">
            Precisamos de mais algumas informações para criar sua conta no AurAAACEC.
          </p>
        </div>
        
        <OnboardingForm defaultFullName={defaultFullName} />
      </div>
    </div>
  )
}
