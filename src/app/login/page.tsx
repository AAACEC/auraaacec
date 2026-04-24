import { signInWithGoogle } from './actions'
import { AlertCircle } from 'lucide-react'

export default async function LoginPage(props: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const searchParams = await props.searchParams;
  const error = searchParams.error;

  return (
    <div className="container mx-auto px-4 flex h-[calc(100vh-4rem)] flex-col items-center justify-center">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight text-primary">
            Login e Cadastro
          </h1>
          <p className="text-sm text-muted-foreground">
            Acesse com seu e-mail institucional da Unicamp
          </p>
        </div>

        {error === 'invalid-email' && (
          <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <p>Apenas e-mails <strong>@dac.unicamp.br</strong> são permitidos.</p>
          </div>
        )}

        <form action={signInWithGoogle}>
          <button
            type="submit"
            className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-bold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 w-full shadow-lg"
          >
            Entrar com Google
          </button>
        </form>

      </div>
    </div>
  );
}
