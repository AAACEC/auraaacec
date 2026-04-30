'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Send, Pencil, Trash2, Users, Briefcase, X, Loader2, CheckCircle2, Lock, Clock, Rocket, Search, UserPlus, Upload } from 'lucide-react'
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
      } catch (error: any) {
        toast.error(error.message || 'Erro ao enviar.')
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
                  "group relative border-2 p-5 rounded-2xl bg-card transition-all shadow-sm overflow-hidden",
                  isFinalized ? "opacity-75 grayscale-[0.5] border-muted" : "hover:border-primary/40 hover:shadow-md"
                )}
              >
                {/* Visual indicator for status */}
                <div className={cn(
                  "absolute top-0 left-0 w-1 h-full",
                  isFinalized ? "bg-muted" : isInProgress ? "bg-amber-500" : "bg-green-500"
                )} />

                <div className="flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2.5 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className={cn(
                          "font-bold text-xl leading-tight tracking-tight text-foreground",
                          isFinalized && "line-through text-muted-foreground/60"
                        )}>
                          {task.title}
                        </p>
                        
                        <div className="flex items-center gap-1.5">
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
                      </div>

                      {task.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2 max-w-2xl leading-relaxed font-medium">
                          {task.description}
                        </p>
                      )}
                    </div>
                    
                    {/* Desktop Admin Actions */}
                    {isAdminOrDirector && (
                      <div className="hidden sm:flex items-center gap-1 bg-muted/30 p-1 rounded-xl border-2">
                        {!isFinalized && (
                          <button 
                            onClick={() => openModal(task, 'finalize')} 
                            className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-green-100 text-muted-foreground hover:text-green-600 transition-colors"
                            title="Finalizar e dar Aura"
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => openModal(task, 'edit')} 
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-white text-muted-foreground hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => openModal(task, 'delete')} 
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors"
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Metadata Row */}
                  <div className="flex flex-wrap items-center gap-y-2 gap-x-6 pt-1 border-t-2 border-muted/30">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                      <Briefcase className="h-3.5 w-3.5 text-primary/60" /> 
                      <span>{task.originArea}</span>
                    </div>

                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-black">
                      <Users className={cn("h-3.5 w-3.5", isFull && !isParticipant && !isFinalized ? "text-red-500" : "text-primary/60")} /> 
                      <span className={cn(isFull && !isParticipant && !isFinalized && "text-red-600")}>
                        {participantCount}/{task.maxParticipants} Vagas
                      </span>
                    </div>

                    {/* Mobile Admin Actions (Inside Metadata row for space) */}
                    {isAdminOrDirector && (
                      <div className="sm:hidden flex items-center gap-3 ml-auto">
                         {!isFinalized && (
                          <button onClick={() => openModal(task, 'finalize')} className="text-green-600"><CheckCircle2 className="h-4 w-4" /></button>
                        )}
                        <button onClick={() => openModal(task, 'edit')} className="text-muted-foreground"><Pencil className="h-4 w-4" /></button>
                        <button onClick={() => openModal(task, 'delete')} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    )}
                  </div>

                  {/* Participants List */}
                  {participantCount > 0 && (
                    <div className="flex flex-wrap gap-2 py-1">
                      {taskAssignments.map((a: any) => (
                        <span key={a.id} className="text-[11px] bg-primary/5 px-3 py-1 rounded-full text-primary font-bold border border-primary/10 uppercase tracking-tight">
                          {a.userNickname}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Main Action Buttons */}
                  <div className="pt-2">
                    {isFinalized ? (
                      <div className="w-full py-2.5 rounded-xl border-2 border-muted text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/10">
                        Esta task foi concluída
                      </div>
                    ) : alreadySubmitted ? (
                      <div className="w-full py-2.5 rounded-xl border-2 border-primary/20 text-center text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 flex items-center justify-center gap-2">
                        <CheckCircle2 className="h-3 w-3" /> Sua prova está em validação
                      </div>
                    ) : isParticipant ? (
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                        <button 
                          onClick={() => task.requiresAttachment ? openModal(task, 'submit') : handleDirectSubmit(task.id)}
                          disabled={isLoading}
                          className="sm:col-span-3 inline-flex items-center justify-center rounded-xl text-xs font-black bg-primary text-primary-foreground hover:bg-primary/90 h-11 transition-all shadow-sm active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Entregar Prova <Send className="ml-2.5 h-4 w-4" /></>}
                        </button>
                        <button 
                          onClick={() => handleLeave(task.id)}
                          disabled={isLoading}
                          className="sm:col-span-1 h-11 inline-flex items-center justify-center rounded-xl border-2 border-red-100 hover:bg-red-50 text-red-600 transition-all active:scale-95 disabled:opacity-50 text-[10px] font-black uppercase tracking-widest"
                        >
                          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Sair'}
                        </button>
                      </div>
                    ) : isFull ? (
                      <div className="w-full py-2.5 rounded-xl border-2 border-red-100 text-center text-[10px] font-black uppercase tracking-widest text-red-600 bg-red-50">
                        Limite de participantes atingido
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleJoin(task.id)}
                        disabled={isLoading}
                        className="w-full inline-flex items-center justify-center rounded-xl text-xs font-black border-2 border-primary text-primary hover:bg-primary hover:text-white h-11 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest"
                      >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Assumir Task'}
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

      <Dialog open={modalType === 'submit'} onOpenChange={(open) => !open && !isPending && closeModal()}>
        <DialogContent className="sm:max-w-[400px] rounded-2xl">
          {selectedTask && (
            <form action={handleSubmit}>
              <input type="hidden" name="taskId" value={selectedTask.id} />
              <DialogHeader>
                <DialogTitle className="text-xl font-bold tracking-tight">Entregar Prova</DialogTitle>
                <DialogDescription className="font-bold text-primary uppercase text-[10px] tracking-widest">{selectedTask.title}</DialogDescription>
              </DialogHeader>
              
              <div className="py-6 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="proof" className="font-bold uppercase text-[10px] tracking-widest text-muted-foreground">
                    Selecionar Arquivo (Imagem ou PDF)
                  </Label>
                  
                  <div className="relative group">
                    <input 
                      id="proof" 
                      name="file" 
                      type="file" 
                      accept="image/*,.pdf"
                      required
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    />
                    <div className="h-24 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-2 group-hover:border-primary/50 group-hover:bg-primary/5 transition-all">
                      <Upload className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tighter">Clique para selecionar</span>
                    </div>
                  </div>
                  
                  <p className="text-[10px] text-muted-foreground mt-2 font-medium italic">
                    {selectedTask.requiresAttachment 
                      ? "Esta tarefa exige comprovação para ser validada." 
                      : "Esta tarefa não exige anexo, mas você pode fornecer um."}
                  </p>
                </div>
              </div>

              <DialogFooter>
                <button 
                  type="submit" 
                  disabled={isPending}
                  className="w-full inline-flex items-center justify-center rounded-xl text-sm font-black bg-primary text-primary-foreground h-12 px-4 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest shadow-md"
                >
                  {isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Confirmar Entrega'}
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
