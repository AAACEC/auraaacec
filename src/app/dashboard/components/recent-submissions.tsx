import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { CheckCircle2, Clock, XCircle } from 'lucide-react'

export function RecentSubmissions({ userSubmissions }: { userSubmissions: any[] }) {
  return (
    <Card className="col-span-1 flex flex-col border-2 shadow-sm rounded-2xl overflow-hidden">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-bold">Atividade Recente</CardTitle>
        <CardDescription className="text-xs font-medium">Status das suas últimas tasks.</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pt-8 pb-10">
        {userSubmissions.length > 0 ? (
          <div className="space-y-4">
            {userSubmissions.map((submission) => (
              <div key={submission.id} className="flex items-center justify-between border-b-2 border-muted pb-4 last:border-0 last:pb-0">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-base font-bold leading-none tracking-tight">
                      {submission.taskTitle || 'Removida'}
                    </p>
                    {submission.validationStatus === 'Aprovada' && (
                      <span className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100 uppercase tracking-tighter">
                        +{submission.auraValue} AURA
                      </span>
                    )}
                  </div>
                  {submission.attachmentLink && (
                    <p className="text-xs text-muted-foreground truncate max-w-[180px] font-medium">
                      <a href={submission.attachmentLink} target="_blank" rel="noreferrer" className="hover:underline text-primary">
                        Link enviado
                      </a>
                    </p>
                  )}
                </div>
                <div className="flex items-center">
                  <div
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest
                      ${
                        submission.validationStatus === 'Aprovada'
                          ? 'bg-green-100 text-green-700'
                          : submission.validationStatus === 'Rejeitada'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                  >
                    {submission.validationStatus === 'Aprovada' ? (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    ) : submission.validationStatus === 'Rejeitada' ? (
                      <XCircle className="h-3.5 w-3.5" />
                    ) : (
                      <Clock className="h-3.5 w-3.5" />
                    )}
                    {submission.validationStatus}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-[150px] items-center justify-center rounded-xl border-2 border-dashed bg-muted/20">
            <p className="text-sm text-muted-foreground italic font-medium px-4">Nenhuma submissão.</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
