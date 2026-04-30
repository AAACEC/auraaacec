'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Send, Pencil, Trash2, Users, Briefcase, X, Loader2, CheckCircle2, Lock, Clock, Rocket, Search, UserPlus } from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { submitTaskProof, joinTask, leaveTask } from '@/app/dashboard/member-actions'
import { deleteTask, updateTask, finalizeTask } from '@/app/dashboard/admin-actions'
import { toast } from 'sonner'
import { useState, useTransition, useEffect } from 'react'
import { cn } from '@/lib/utils'

export function BountyBoard({ 
  activeTasks, 
  userSubmissions, 
  assignments = [],
  currentUserId,
  isAdminOrDirector = false,
  allProfiles = []
}: { 
  activeTasks: any[], 
  userSubmissions: any[],
  assignments?: any[],
  currentUserId?: string,
  isAdminOrDirector?: boolean,
  allProfiles?: any[]
}) {
  const [selectedTask, setSelectedTask] = useState<any | null>(null)
  const [modalType, setModalType] = useState<'submit' | 'edit' | 'delete' | 'finalize' | null>(null)
  const [selectedMember, setSelectedMember] = useState<any | null>(null)
  const [isPending, startTransition] = useTransition()
  const [actionTaskId, setActionTaskId] = useState<string | null>(null)

  // States for task editing assignments
  const [editingAssignedMemberIds, setEditingAssignedMemberIds] = useState<string[]>([])
  const [memberSearch, setMemberSearch] = useState('')

  const openModal = (task: any, type: 'submit' | 'edit' | 'delete' | 'finalize', member?: any) => {
    setSelectedTask(task)
    setModalType(type)
    if (member) setSelectedMember(member)
    
    if (type === 'edit') {
      const currentTaskAssignments = assignments.filter(a => a.taskId === task.id)
      setEditingAssignedMemberIds(currentTaskAssignments.map(a => a.userId))
      setMemberSearch('')
    }
  }

  const closeModal = () => {
    setSelectedTask(null)
    setModalType(null)
    setSelectedMember(null)
    setEditingAssignedMemberIds([])
    setMemberSearch('')
  }

  const toggleEditingMemberAssignment = (memberId: string, maxParticipants: number) => {
    setEditingAssignedMemberIds(prev => {
      if (prev.includes(memberId)) {
        return prev.filter(id => id !== memberId)
      }
      if (maxParticipants && prev.length >= maxParticipants) {
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

  const handleUpdate = async (formData: FormData) => {
    editingAssignedMemberIds.forEach(id => formData.append('assignedMembers', id))
    
    startTransition(async () => {
      try {
        await updateTask(formData)
        toast.success('Tarefa salva!')
        closeModal()
      } catch (error) {
        toast.error('Erro ao salvar.')
      }
    })
  }

  const handleSubmit = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await submitTaskProof(formData)
        toast.success('Task submetida!')
        closeModal()
      } catch (error) {
        toast.error('Erro ao enviar.')
      }
    })
  }

  const handleDirectSubmit = async (taskId: string) => {
    const formData = new FormData()
    formData.append('taskId', taskId)
    formData.append('attachmentLink', '')
    
    setActionTaskId(taskId)
    startTransition(async () => {
      try {
        await submitTaskProof(formData)
        toast.success('Task concluída com sucesso!')
      } catch (error) {
        toast.error('Erro ao concluir task.')
      } finally {
        setActionTaskId(null)
      }
    })
  }

  const handleJoin = async (taskId: string) => {
    setActionTaskId(taskId)
    startTransition(async () => {
      try {
        await joinTask(taskId)
        toast.success('Você assumiu esta task!')
      } catch (error: any) {
        toast.error(error.message || 'Erro ao participar.')
      } finally {
        setActionTaskId(null)
      }
    })
  }

  const handleLeave = async (taskId: string) => {
    setActionTaskId(taskId)
    startTransition(async () => {
      try {
        await leaveTask(taskId)
        toast.success('Você saiu da task.')
      } catch (error) {
        toast.error('Erro ao sair.')
      } finally {
        setActionTaskId(null)
      }
    })
  }

  const handleDelete = async (formData: FormData) => {
    startTransition(async () => {
      try {
        await deleteTask(formData)
        toast.success('Tarefa removida!')
        closeModal()
      } catch (error) {
        toast.error('Erro ao remover.')
      }
    })
  }

  const handleFinalize = async () => {
    if (!selectedTask) return
    startTransition(async () => {
      try {
        await finalizeTask(selectedTask.id)
        toast.success('Tarefa finalizada!')
        closeModal()
      } catch (error) {
        toast.error('Erro ao finalizar.')
      }
    })
  }

  return (
    <div className="space-y-4">
      {activeTasks.length > 0 ? (
        <div className="space-y-4">
          {activeTasks.map((task) => {
            const alreadySubmitted = userSubmissions.some(s => s.taskId === task.id && (s.validationStatus === 'Pendente' || s.validationStatus === 'Aprovada'))
            const taskAssignments = assignments.filter(a => a.taskId === task.id)
            const participantCount = taskAssignments.length
            const isParticipant = taskAssignments.some(a => a.userId === currentUserId)
            const isFull = task.maxParticipants !== null && participantCount >= task.maxParticipants
            const isLoading = actionTaskId === task.id && isPending
            const isFinalized = task.status === 'Finalizada'
            const isInProgress = !isFinalized && participantCount > 0

            return (
              <Card 
                key={task.id} 
                className={cn(
                  "group relative border-2 p-6 rounded-2xl bg-card transition-all shadow-sm",
                  isFinalized ? "opacity-75 grayscale-[0.5] border-muted" : "hover:border-primary/50"
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <p className={cn(
                        "font-bold text-xl leading-tight tracking-tight text-foreground",
                        isFinalized && "line-through text-muted-foreground"
                      )}>
                        {task.title}
                      </p>
                      
                      <div className="flex items-center gap-2">
                        {isFinalized ? (
                          <Badge variant="secondary" className="bg-muted text-muted-foreground font-black text-[9px] px-2 py-0.5 uppercase tracking-tighter flex items-center gap-1 border-2">
                            <Lock className="h-2.5 w-2.5" /> Concluída
                          </Badge>
                        ) : isInProgress ? (
                          <Badge variant="outline" className="text-amber-600 border-amber-200 bg-amber-50 font-black text-[9px] px-2 py-0.5 uppercase tracking-tighter flex items-center gap-1 border-2">
                            <Clock className="h-2.5 w-2.5" /> Em Andamento
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50 font-black text-[9px] px-2 py-0.5 uppercase tracking-tighter flex items-center gap-1 border-2">
                            <Rocket className="h-2.5 w-2.5" /> Aberta
                          </Badge>
                        )}

                        {!isFinalized && (
                          <Badge variant="outline" className="text-primary border-primary/20 bg-primary/5 font-black text-[9px] px-2 py-0.5 uppercase tracking-tighter border-2">
                            {task.auraValue} AURA
                          </Badge>
                        )}
                      </div>

                      {isAdminOrDirector && (
                        <div className="flex gap-1 transition-opacity">
                          {!isFinalized && (
                            <button 
                              onClick={() => openModal(task, 'finalize')} 
                              className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-green-50 text-muted-foreground hover:text-green-600 transition-colors"
                              title="Marcar como Finalizada"
                            >
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                          <button onClick={() => openModal(task, 'edit')} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-muted text-muted-foreground transition-colors">
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button onClick={() => openModal(task, 'delete')} className="h-7 w-7 inline-flex items-center justify-center rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-muted-foreground uppercase tracking-widest font-bold">
                      <span className="flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" /> {task.originArea}</span>
                      <span className={`flex items-center gap-1.5 ${isFull && !isParticipant && !isFinalized ? 'text-red-600' : ''}`}>
                        <Users className="h-3.5 w-3.5" /> {participantCount}/{task.maxParticipants}
                      </span>
                      {task.creatorNickname && (
                        <span className="flex items-center gap-1.5 opacity-60">
                          Criado por: <span className="text-foreground">{task.creatorNickname}</span>
                        </span>
                      )}
                    </div>

                    {participantCount > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {taskAssignments.map((a: any) => (
                          <div key={a.id} className="group/member relative">
                            <span className="text-[13px] bg-muted/70 px-4 py-1.5 rounded-full text-foreground font-black border-2 uppercase tracking-tight shadow-sm transition-all hover:bg-muted inline-flex items-center gap-2">
                              {a.userNickname}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {task.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl mt-3 leading-relaxed font-medium">
                        {task.description}
                      </p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    {isFinalized ? (
                      <Badge variant="outline" className="border-muted-foreground/20 text-muted-foreground font-bold px-6 py-2 uppercase text-xs tracking-widest bg-muted/20">Concluída</Badge>
                    ) : alreadySubmitted ? (
                      <Badge variant="secondary" className="bg-muted text-muted-foreground font-bold px-6 py-2 uppercase text-xs tracking-widest">Enviada</Badge>
                    ) : isParticipant ? (
                      <>
                        <button 
                          onClick={() => task.requiresAttachment ? openModal(task, 'submit') : handleDirectSubmit(task.id)}
                          disabled={isLoading}
                          className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90 h-11 px-8 transition-all shadow-sm active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Enviar <Send className="ml-2.5 h-4 w-4" /></>}
                        </button>
                        <button 
                          onClick={() => handleLeave(task.id)}
                          disabled={isLoading}
                          className="h-11 w-11 inline-flex items-center justify-center rounded-xl border-2 border-input hover:bg-red-50 hover:text-red-600 text-muted-foreground transition-all active:scale-95 disabled:opacity-50"
                          title="Sair da task"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-5 w-5" />}
                        </button>
                      </>
                    ) : isFull ? (
                      <Badge variant="outline" className="text-red-600 border-red-200 bg-red-50 font-black px-6 py-2 uppercase tracking-widest text-xs">Lotada</Badge>
                    ) : (
                      <button 
                        onClick={() => handleJoin(task.id)}
                        disabled={isLoading}
                        className="inline-flex items-center justify-center whitespace-nowrap rounded-xl text-xs font-black border-2 border-primary text-primary hover:bg-primary hover:text-white h-11 px-8 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Participar'}
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="flex h-[200px] items-center justify-center rounded-2xl border-2 border-dashed bg-muted/30">
          <p className="text-sm text-muted-foreground font-medium italic">Sem tasks no momento.</p>
        </div>
      )}

      {/* Global Modals */}
      <Dialog open={modalType === 'submit'} onOpenChange={(open) => !open && !isPending && closeModal()}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          {selectedTask && (
            <form action={handleSubmit}>
              <input type="hidden" name="taskId" value={selectedTask.id} />
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Enviar Anexo</DialogTitle>
                <DialogDescription className="font-bold text-primary uppercase text-[10px] tracking-widest">{selectedTask.title}</DialogDescription>
              </DialogHeader>
              <div className="py-6">
                <Label htmlFor="attachmentLink" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                  Link do Anexo
                </Label>
                <Input 
                  id="attachmentLink" 
                  name="attachmentLink" 
                  required
                  className="mt-2 h-11 rounded-xl border-2 focus-visible:ring-primary" 
                />
                <p className="text-[10px] text-muted-foreground mt-2 font-medium">
                  Esta tarefa exige um link comprobatório para ser validada.
                </p>
              </div>
              <DialogFooter>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center rounded-xl text-sm font-black bg-primary text-primary-foreground h-12 px-4 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-md"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Submeter Task'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={modalType === 'edit'} onOpenChange={(open) => !open && !isPending && closeModal()}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl">
          {selectedTask && (
            <form action={handleUpdate}>
              <input type="hidden" name="taskId" value={selectedTask.id} />
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Editar Task</DialogTitle>
              </DialogHeader>
              <div className="grid gap-5 py-6">
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-title" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Título</Label>
                  <Input id="edit-title" name="title" defaultValue={selectedTask.title} required className="h-11 rounded-xl border-2" />
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-desc" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Descrição</Label>
                  <Textarea id="edit-desc" name="description" defaultValue={selectedTask.description || ''} className="rounded-xl border-2 min-h-[100px]" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-area" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Área</Label>
                    <select 
                      id="edit-area" 
                      name="originArea" 
                      defaultValue={selectedTask.originArea}
                      className="h-11 rounded-xl border-2 border-input bg-background px-3 text-sm focus:border-primary outline-none"
                    >
                      <option value="100Nossao">100Nossão</option>
                      <option value="Produtos">Produtos</option>
                      <option value="Eventos">Eventos</option>
                      <option value="Esportes">Esportes</option>
                      <option value="Cultura">Cultura</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Administração">Administração</option>
                    </select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="edit-aura" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Aura</Label>
                    <Input id="edit-aura" name="auraValue" type="number" min="1" defaultValue={selectedTask.auraValue} required className="h-11 rounded-xl border-2" />
                  </div>
                </div>
                <div className="grid gap-1.5">
                  <Label htmlFor="edit-limit" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">Vagas</Label>
                  <Input id="edit-limit" name="maxParticipants" type="number" min="1" defaultValue={selectedTask.maxParticipants} required className="h-11 rounded-xl border-2" />
                </div>

                {/* Member Assignment Section */}
                <div className="space-y-2">
                  <Label className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground flex items-center gap-1">
                    <UserPlus className="h-3 w-3" /> Gerenciar Membros ({editingAssignedMemberIds.length}{selectedTask.maxParticipants ? `/${selectedTask.maxParticipants}` : ''})
                  </Label>
                  
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <input 
                      type="text"
                      placeholder="Buscar membro..."
                      value={memberSearch}
                      onChange={(e) => setMemberSearch(e.target.value)}
                      className="w-full h-8 pl-8 pr-3 rounded-lg border-2 border-input bg-background text-[10px] focus:border-primary outline-none transition-all font-bold uppercase tracking-tighter"
                    />
                  </div>

                  <div className="max-h-[120px] overflow-y-auto border-2 rounded-xl p-2 space-y-1 bg-muted/20">
                    {filteredMembers.map(p => (
                      <div 
                        key={p.id} 
                        onClick={() => toggleEditingMemberAssignment(p.id, selectedTask.maxParticipants)}
                        className={`flex items-center justify-between px-3 py-1.5 rounded-lg cursor-pointer transition-all border-2
                          ${editingAssignedMemberIds.includes(p.id) 
                            ? 'bg-primary/10 border-primary/30 text-primary' 
                            : 'hover:bg-muted border-transparent text-muted-foreground'}`}
                      >
                        <span className="text-xs font-bold">{p.nickname}</span>
                        {editingAssignedMemberIds.includes(p.id) && <CheckCircle2 className="h-3 w-3" />}
                      </div>
                    ))}
                    {filteredMembers.length === 0 && (
                      <p className="text-[10px] italic text-center py-2 text-muted-foreground">
                        Nenhum membro encontrado.
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-2">
                  <input 
                    type="checkbox" 
                    id="edit-requiresAttachment" 
                    name="requiresAttachment" 
                    defaultChecked={selectedTask.requiresAttachment}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="edit-requiresAttachment" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Exigir Anexo na Entrega</Label>
                </div>
              </div>
              <DialogFooter>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center rounded-xl text-sm font-black bg-primary text-primary-foreground h-12 px-4 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-md"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Salvar Alterações'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={modalType === 'delete'} onOpenChange={(open) => !open && !isPending && closeModal()}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          {selectedTask && (
            <form action={handleDelete}>
              <input type="hidden" name="taskId" value={selectedTask.id} />
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Excluir Task</DialogTitle>
                <DialogDescription className="font-medium">
                  Deseja remover <span className="text-primary font-bold">"{selectedTask.title}"</span> permanentemente?
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-6 flex-row gap-3">
                <button type="button" disabled={isPending} onClick={closeModal} className="flex-1 rounded-xl border-2 h-12 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50 uppercase tracking-widest">Cancelar</button>
                <button type="submit" disabled={isPending} className="flex-1 rounded-xl bg-red-600 text-white h-12 text-sm font-black hover:bg-red-700 transition-colors active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-md">
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Excluir'}
                </button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={modalType === 'finalize'} onOpenChange={(open) => !open && !isPending && closeModal()}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          {selectedTask && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Finalizar Task</DialogTitle>
                <DialogDescription className="font-medium">
                  Deseja marcar <span className="text-primary font-bold">"{selectedTask.title}"</span> como Finalizada? 
                  Isso impedirá novas participações.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="pt-6 flex-row gap-3">
                <button type="button" disabled={isPending} onClick={closeModal} className="flex-1 rounded-xl border-2 h-12 text-sm font-bold hover:bg-muted transition-colors disabled:opacity-50 uppercase tracking-widest">Cancelar</button>
                <button 
                  onClick={handleFinalize} 
                  disabled={isPending} 
                  className="flex-1 rounded-xl bg-green-600 text-white h-12 text-sm font-black hover:bg-green-700 transition-colors active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-md"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : 'Finalizar'}
                </button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
