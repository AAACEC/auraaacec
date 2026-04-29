'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { CheckCircle2, XCircle, Users, ExternalLink, Eye, Loader2, Plus, Filter, UserPlus, Search } from 'lucide-react'
import { createTask, validateSubmission, updateUserRole } from '@/app/dashboard/admin-actions'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { toast } from 'sonner'
import { useRef, useTransition, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export function AdminPanel({ 
  pendingSubmissions, 
  allProfiles = [], 
  currentRole 
}: { 
  pendingSubmissions: any[], 
  allProfiles?: any[],
  currentRole: string
}) {
  const createTaskFormRef = useRef<HTMLFormElement>(null)
  const [isPending, startTransition] = useTransition()
  const [selectedSubmission, setSelectedSubmission] = useState<any | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  
  // States for initial assignments
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('')
  const [assignedMemberIds, setAssignedMemberIds] = useState<string[]>([])
  const [memberSearch, setMemberSearch] = useState('')

  const router = useRouter()
  const searchParams = useSearchParams()

  const handleCreateTask = async (formData: FormData) => {
    assignedMemberIds.forEach(id => formData.append('assignedMembers', id))
    
    setActionId('create-task')
    startTransition(async () => {
      try {
        await createTask(formData)
        toast.success('Task criada com sucesso!')
        createTaskFormRef.current?.reset()
        setAssignedMemberIds([])
        setMaxParticipants('')
        setMemberSearch('')
      } catch (error) {
        toast.error('Erro ao criar task.')
      } finally {
        setActionId(null)
      }
    })
  }

  const toggleMemberAssignment = (memberId: string) => {
    setAssignedMemberIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId)
      }
      if (maxParticipants !== '' && prev.length >= maxParticipants) {
        toast.error(`Limite de ${maxParticipants} participantes atingido.`)
        return prev
      }
      return [...prev, memberId]
    })
  }

  const filteredMembers = allProfiles.filter(p => 
    p.nickname.toLowerCase().includes(memberSearch.toLowerCase()) ||
    p.fullName.toLowerCase().includes(memberSearch.toLowerCase())
  )

  const handleValidate = async (formData: FormData) => {
    const status = formData.get('status') as string
    const submissionId = formData.get('submissionId') as string
    setActionId(`validate-${submissionId}-${status}`)
    startTransition(async () => {
      try {
        await validateSubmission(formData)
        toast.success(`Submissão ${status.toLowerCase()}!`)
        setIsDetailsOpen(false)
        setSelectedSubmission(null)
      } catch (error) {
        toast.error('Erro na validação.')
      } finally {
        setActionId(null)
      }
    })
  }

  const handleUpdateRole = async (formData: FormData, userId: string) => {
    setActionId(`role-${userId}`)
    startTransition(async () => {
      try {
        await updateUserRole(formData)
        toast.success('Cargo atualizado!')
      } catch (error) {
        toast.error('Erro ao atualizar.')
      } finally {
        setActionId(null)
      }
    })
  }

  const handleFilterArea = (area: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (area === 'all') {
      params.delete('adminArea')
    } else {
      params.set('adminArea', area)
    }
    router.push(`/dashboard?${params.toString()}`)
  }

  const openDetails = (submission: any) => {
    setSelectedSubmission(submission)
    setIsDetailsOpen(true)
  }

  const areas = ['100Nossao', 'Produtos', 'Eventos', 'Esportes', 'Cultura', 'Marketing', 'Administração'];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {/* Create Task Card */}
      <Card className="col-span-1 border-2 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" /> Nova Task
          </CardTitle>
        </CardHeader>
        <form ref={createTaskFormRef} action={handleCreateTask} className="flex-1 flex flex-col">
          <CardContent className="space-y-4 pt-8 pb-4 flex-1">
            <div className="space-y-1.5">
              <Label htmlFor="title" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Título</Label>
              <Input id="title" name="title" required className="h-10 rounded-xl border-2" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="description" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Descrição (Opcional)</Label>
              <Textarea id="description" name="description" className="rounded-xl border-2 min-h-[80px]" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="originArea" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Área</Label>
                <select 
                  id="originArea" 
                  name="originArea" 
                  required 
                  className="flex h-10 w-full rounded-xl border-2 border-input bg-background px-3 py-2 text-sm focus:border-primary outline-none"
                >
                  {areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="auraValue" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Aura</Label>
                <Input id="auraValue" name="auraValue" type="number" min="1" required className="h-10 rounded-xl border-2" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="maxParticipants" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Vagas</Label>
              <Input 
                id="maxParticipants" 
                name="maxParticipants" 
                type="number" 
                min="1" 
                required
                className="h-10 rounded-xl border-2" 
                value={maxParticipants}
                onChange={(e) => setMaxParticipants(e.target.value ? parseInt(e.target.value) : '')}
              />
            </div>

            {/* Member Assignment Section */}
            <div className="space-y-2">
              <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-1">
                <UserPlus className="h-3 w-3" /> Escalar Membros ({assignedMemberIds.length}{maxParticipants ? `/${maxParticipants}` : ''})
              </Label>
              
              {/* Search Bar for Members */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <input 
                  type="text"
                  placeholder="Buscar membro..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full h-8 pl-8 pr-3 rounded-lg border-2 border-input bg-background text-[10px] focus:border-primary outline-none transition-all"
                />
              </div>

              <div className="max-h-[150px] overflow-y-auto border-2 rounded-xl p-2 space-y-1 bg-muted/20">
                {filteredMembers.map(p => (
                  <div 
                    key={p.id} 
                    onClick={() => toggleMemberAssignment(p.id)}
                    className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all border-2
                      ${assignedMemberIds.includes(p.id) 
                        ? 'bg-primary/10 border-primary/30 text-primary' 
                        : 'hover:bg-muted border-transparent text-muted-foreground'}`}
                  >
                    <span className="text-xs font-bold">{p.nickname}</span>
                    {assignedMemberIds.includes(p.id) && <CheckCircle2 className="h-3 w-3" />}
                  </div>
                ))}
                {filteredMembers.length === 0 && (
                  <p className="text-[10px] italic text-center py-2 text-muted-foreground">
                    {allProfiles.length === 0 ? 'Nenhum membro disponível.' : 'Nenhum membro encontrado.'}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center space-x-2 pt-2">
              <input 
                type="checkbox" 
                id="requiresAttachment" 
                name="requiresAttachment" 
                defaultChecked 
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <Label htmlFor="requiresAttachment" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Exigir Anexo na Entrega</Label>
            </div>
          </CardContent>
          <CardFooter className="pb-8">
            <button 
              type="submit" 
              disabled={isPending}
              className="w-full inline-flex items-center justify-center rounded-xl text-sm font-black bg-primary text-primary-foreground h-11 px-4 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-sm"
            >
              {actionId === 'create-task' ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Publicar'}
            </button>
          </CardFooter>
        </form>
      </Card>

      {/* Pending Validations List */}
      <Card className="col-span-1 border-2 shadow-sm rounded-2xl overflow-hidden flex flex-col">
        <CardHeader className="pb-4 border-b">
          <div className="flex flex-col gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-primary" /> Validações
            </CardTitle>
            
            {/* Area Filter */}
            <div className="flex items-center gap-2 bg-muted/50 p-1.5 rounded-lg border-2">
              <Filter className="h-3 w-3 text-muted-foreground ml-1" />
              <select 
                className="bg-transparent text-[10px] font-bold uppercase tracking-tighter outline-none w-full cursor-pointer"
                defaultValue={searchParams.get('adminArea') || 'all'}
                onChange={(e) => handleFilterArea(e.target.value)}
              >
                <option value="all">Todas as Áreas</option>
                {areas.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-8 pb-10 flex-1">
          {pendingSubmissions.length > 0 ? (
            <div className="space-y-4 max-h-[450px] overflow-y-auto pr-2">
              {pendingSubmissions.map((item) => (
                <div key={item.submission.id} className="flex flex-col space-y-3 rounded-xl border-2 p-4 shadow-sm bg-card hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-bold tracking-tight">{item.taskTitle}</p>
                      <span className="text-[9px] font-black uppercase text-muted-foreground/60">{item.taskArea}</span>
                    </div>
                    <Badge variant="secondary" className="font-black text-[10px] bg-primary/10 text-primary border-none whitespace-nowrap">+{item.auraValue} AURA</Badge>
                  </div>
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">
                    Por: <span className="text-foreground">{item.memberNickname}</span>
                  </p>
                  
                  <button 
                    onClick={() => openDetails(item)}
                    className="w-full inline-flex items-center justify-center rounded-lg text-[10px] font-black border-2 border-input hover:bg-muted h-8 px-3 uppercase tracking-widest transition-all"
                  >
                    <Eye className="mr-1.5 h-3 w-3" /> Detalhes
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex h-[150px] items-center justify-center rounded-xl border-2 border-dashed bg-muted/20">
              <p className="text-xs text-muted-foreground font-medium italic">Tudo em dia!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Management Section (Only for Presidência) */}
      {currentRole === 'Presidência' && (
        <Card className="col-span-1 border-2 shadow-sm rounded-2xl overflow-hidden flex flex-col">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-primary" /> Gestão AAACEC
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 pb-10 flex-1">
            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2">
              {allProfiles.map((p) => {
                const isChangingRole = actionId === `role-${p.id}` && isPending;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 border-b-2 border-muted pb-3 last:border-0 transition-colors group">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold tracking-tight">{p.nickname}</span>
                      <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-wider">{p.fullName}</span>
                    </div>
                    <form action={(formData) => handleUpdateRole(formData, p.id)} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={p.id} />
                      <select 
                        name="role"
                        defaultValue={p.role}
                        disabled={isPending}
                        className="h-8 rounded-lg border-2 border-input bg-background px-2 py-1 text-[10px] font-black uppercase tracking-tighter focus:border-primary outline-none transition-all disabled:opacity-50"
                        onChange={(e) => e.target.form?.requestSubmit()}
                      >
                        <option value="Presidência">Pres</option>
                        <option value="Diretoria">Dir</option>
                        <option value="Gestão">Gest</option>
                      </select>
                      {isChangingRole && <Loader2 className="h-3 w-3 animate-spin text-primary" />}
                    </form>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Global Details Modal */}
      <Dialog open={isDetailsOpen} onOpenChange={(open) => !open && !isPending && setIsDetailsOpen(false)}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          {selectedSubmission && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Anexo Submetido</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-6">
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Task</p>
                  <p className="text-sm font-bold">{selectedSubmission.taskTitle}</p>
                  {selectedSubmission.taskDescription && <p className="text-xs text-muted-foreground italic leading-relaxed">{selectedSubmission.taskDescription}</p>}
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Integrante</p>
                  <p className="text-sm font-medium">{selectedSubmission.memberFullName} ({selectedSubmission.memberNickname})</p>
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Anexo</p>
                  {selectedSubmission.submission.attachmentLink ? (
                    <a 
                      href={selectedSubmission.submission.attachmentLink} 
                      target="_blank" 
                      rel="noreferrer"
                      className="text-sm text-primary font-bold hover:underline flex items-center gap-1.5"
                    >
                      Abrir Link <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  ) : (
                    <p className="text-xs text-muted-foreground italic bg-muted p-2 rounded-lg">Nenhum anexo fornecido.</p>
                  )}
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-3">
                <form action={handleValidate} className="flex-1">
                  <input type="hidden" name="submissionId" value={selectedSubmission.submission.id} />
                  <input type="hidden" name="status" value="Aprovada" />
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full inline-flex items-center justify-center rounded-xl text-xs font-black bg-green-600 text-white hover:bg-green-700 h-11 px-4 transition-all uppercase tracking-widest shadow-sm"
                  >
                    {actionId === `validate-${selectedSubmission.submission.id}-Aprovada` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aprovar'}
                  </button>
                </form>
                <form action={handleValidate} className="flex-1">
                  <input type="hidden" name="submissionId" value={selectedSubmission.submission.id} />
                  <input type="hidden" name="status" value="Rejeitada" />
                  <button 
                    type="submit" 
                    disabled={isPending}
                    className="w-full inline-flex items-center justify-center rounded-xl text-xs font-black border-2 border-red-200 text-red-600 hover:bg-red-50 h-11 px-4 transition-all uppercase tracking-widest"
                  >
                    {actionId === `validate-${selectedSubmission.submission.id}-Rejeitada` ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Rejeitar'}
                  </button>
                </form>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
