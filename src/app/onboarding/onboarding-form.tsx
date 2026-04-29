'use client'

import { useState } from 'react'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { SubmitButton } from './submit-button'
import { completeOnboarding } from './actions'

export function OnboardingForm({ defaultFullName }: { defaultFullName: string }) {
  const [cpf, setCpf] = useState('')
  const [ra, setRa] = useState('')
  const [entryYear, setEntryYear] = useState('')
  const [courseOption, setCourseOption] = useState('Engenharia de Computação')
  const [customCourse, setCustomCourse] = useState('')

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 11)
    let formatted = digits
    if (digits.length > 3) formatted = `${digits.slice(0, 3)}.${digits.slice(3)}`
    if (digits.length > 6) formatted = `${formatted.slice(0, 7)}.${digits.slice(6)}`
    if (digits.length > 9) formatted = `${formatted.slice(0, 11)}-${digits.slice(9)}`
    return formatted
  }

  const formatRA = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 6)
  }

  const formatEntryYear = (value: string) => {
    return value.replace(/\D/g, '').slice(0, 4)
  }

  return (
    <form action={completeOnboarding} className="space-y-6">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="fullName">Nome Completo</Label>
          <Input
            id="fullName"
            name="fullName"
            type="text"
            defaultValue={defaultFullName}
            required
          />
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="nickname">Apelido (Como você será visto no Ranking)</Label>
          <Input
            id="nickname"
            name="nickname"
            type="text"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="studentId">RA (6 dígitos)</Label>
            <Input
              id="studentId"
              name="studentId"
              type="text"
              value={ra}
              onChange={(e) => setRa(formatRA(e.target.value))}
              placeholder="000000"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="entryYear">Ano de Ingresso</Label>
            <Input
              id="entryYear"
              name="entryYear"
              type="text"
              value={entryYear}
              onChange={(e) => setEntryYear(formatEntryYear(e.target.value))}
              placeholder="2024"
              required
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="cpf">CPF</Label>
          <Input
            id="cpf"
            name="cpf"
            type="text"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            placeholder="000.000.000-00"
            required
          />
        </div>

        {/* Hidden field to send the final course value to the action */}
        <input 
          type="hidden" 
          name="course" 
          value={courseOption === 'Outro' ? customCourse : courseOption} 
        />

        <div className="grid gap-2">
          <Label htmlFor="courseSelect">Curso</Label>
          <select
            id="courseSelect"
            className="flex h-10 w-full rounded-md border-2 border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={courseOption}
            onChange={(e) => setCourseOption(e.target.value)}
          >
            <option value="Engenharia de Computação">Engenharia de Computação</option>
            <option value="Ciência da Computação">Ciência da Computação</option>
            <option value="Outro">Outro</option>
          </select>
        </div>

        {courseOption === 'Outro' && (
          <div className="grid gap-2">
            <Label htmlFor="customCourse">Qual o seu curso?</Label>
            <Input
              id="customCourse"
              type="text"
              value={customCourse}
              onChange={(e) => setCustomCourse(e.target.value)}
              placeholder="Digite o nome do seu curso"
              required={courseOption === 'Outro'}
            />
          </div>
        )}

        <div className="grid gap-2">
          <Label htmlFor="favoriteSong">Música Favorita do 100Nossão (Opcional)</Label>
          <Input
            id="favoriteSong"
            name="favoriteSong"
            type="text"
          />
        </div>
      </div>

      <SubmitButton />
    </form>
  )
}
