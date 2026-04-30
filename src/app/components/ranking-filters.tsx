'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'

export function RankingFilters({ 
  courses, 
  entryYears = [], 
  roles = [],
  isTaskPage = false
}: { 
  courses: string[], 
  entryYears?: string[], 
  roles?: string[],
  isTaskPage?: boolean
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const updateFilters = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value === 'all' || value === '') {
      params.delete(key)
    } else {
      params.set(key, value)
    }
    router.push(`${pathname}?${params.toString()}`)
  }

  return (
    <div className="grid gap-4 p-4 rounded-xl border-2 md:grid-cols-3 lg:grid-cols-5">
      {/* Busca */}
      <div className="space-y-2 lg:col-span-1">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Buscar</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input 
            type="text"
            placeholder={isTaskPage ? "Título da task..." : "Nome ou apelido..."}
            className="w-full h-10 pl-9 pr-3 rounded-xl border-2 border-input bg-background text-sm outline-none focus:border-primary transition-all shadow-sm"
            defaultValue={searchParams.get('q') || ''}
            onChange={(e) => {
              const val = e.target.value
              const timeoutId = setTimeout(() => updateFilters('q', val), 500)
              return () => clearTimeout(timeoutId)
            }}
          />
        </div>
      </div>

      {/* Filtro de Área / Curso */}
      <div className="space-y-2">
        <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{isTaskPage ? 'Área' : 'Curso'}</Label>
        <select 
          className="w-full h-10 rounded-xl border-2 border-input bg-background px-3 text-sm outline-none focus:border-primary transition-all shadow-sm"
          defaultValue={searchParams.get('course') || 'all'}
          onChange={(e) => updateFilters('course', e.target.value)}
        >
          <option value="all">Ver Tudo</option>
          {courses.sort().map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      {!isTaskPage && entryYears.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ano de Ingresso</Label>
          <select 
            className="w-full h-10 rounded-xl border-2 border-input bg-background px-3 text-sm outline-none focus:border-primary transition-all shadow-sm"
            defaultValue={searchParams.get('entryYear') || 'all'}
            onChange={(e) => updateFilters('entryYear', e.target.value)}
          >
            <option value="all">Todos os Anos</option>
            {Array.from(new Set(entryYears.map(e => e.slice(0, 4)))).sort().map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      )}

      {!isTaskPage && roles.length > 0 && (
        <div className="space-y-2">
          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Cargo</Label>
          <select 
            className="w-full h-10 rounded-xl border-2 border-input bg-background px-3 text-sm outline-none focus:border-primary transition-all shadow-sm"
            defaultValue={searchParams.get('role') || 'all'}
            onChange={(e) => updateFilters('role', e.target.value)}
          >
            <option value="all">Todos os Cargos</option>
            {roles.map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
      )}

      {isTaskPage && (
        <>
          {/* Filtro de Disponibilidade */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Disponibilidade</Label>
            <select 
              className="w-full h-10 rounded-xl border-2 border-input bg-background px-3 text-sm outline-none focus:border-primary transition-all shadow-sm"
              defaultValue={searchParams.get('availability') || 'all'}
              onChange={(e) => updateFilters('availability', e.target.value)}
            >
              <option value="all">Ver Todas</option>
              <option value="available">Com Vagas</option>
              <option value="full">Lotadas</option>
            </select>
          </div>

          {/* Ordenação */}
          <div className="space-y-2">
            <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Ordenar por</Label>
            <select 
              className="w-full h-10 rounded-xl border-2 border-input bg-background px-3 text-sm outline-none focus:border-primary transition-all shadow-sm"
              defaultValue={searchParams.get('sort') || 'newest'}
              onChange={(e) => updateFilters('sort', e.target.value)}
            >
              <option value="newest">Mais recentes</option>
              <option value="oldest">Mais antigas</option>
              <option value="aura-high">Maior Aura</option>
              <option value="aura-low">Menor Aura</option>
            </select>
          </div>
        </>
      )}
    </div>
  )
}
