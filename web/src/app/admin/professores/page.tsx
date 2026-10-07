'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Mail, Plus, ShieldOff, UserPlus, Users, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAlterarStatusProfessor, useCriarProfessor, useProfessoresAdmin, mensagemErroAdmin } from '@/hooks/useProfessoresAdmin'
import { adminProfessorSchema, cpfDigits, formatCpf, type AdminProfessorFormData } from '@/lib/schemas/adminProfessorSchema'
import type { ProfessorAdmin } from '@/services/admin'

type StatusFilter = 'TODOS' | 'ATIVOS' | 'INATIVOS'

function statusValue(status: StatusFilter) {
  if (status === 'ATIVOS') return true
  if (status === 'INATIVOS') return false
  return undefined
}

export default function AdminProfessoresPage() {
  const [status, setStatus] = useState<StatusFilter>('TODOS')
  const [formOpen, setFormOpen] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { data: professores = [], isLoading, isError } = useProfessoresAdmin(statusValue(status))
  const criar = useCriarProfessor()
  const alterarStatus = useAlterarStatusProfessor()
  const {
    register,
    reset,
    setValue,
    handleSubmit,
    formState: { errors },
  } = useForm<AdminProfessorFormData>({
    resolver: zodResolver(adminProfessorSchema),
    defaultValues: { nomeCompleto: '', cpf: '', email: '' },
  })

  const submit = (data: AdminProfessorFormData) => {
    setMessage(null)
    setError(null)
    criar.mutate({
      nomeCompleto: data.nomeCompleto.trim(),
      cpf: cpfDigits(data.cpf),
      email: data.email.trim().toLowerCase(),
    }, {
      onSuccess: () => {
        reset()
        setFormOpen(false)
        setMessage('Professor criado. A senha temporária foi enviada por e-mail.')
      },
      onError: (requestError) => setError(mensagemErroAdmin(requestError)),
    })
  }

  const toggleStatus = (professor: ProfessorAdmin) => {
    setMessage(null)
    setError(null)
    alterarStatus.mutate(
      { id: professor.id, ativo: !professor.ativo },
      {
        onSuccess: () => setMessage(`Professor ${professor.ativo ? 'desativado' : 'reativado'} com sucesso.`),
        onError: (requestError) => setError(mensagemErroAdmin(requestError)),
      },
    )
  }

  return (
    <div className="min-h-full px-5 py-6 sm:px-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Administração</p>
          <h1 className="text-3xl font-bold text-foreground">Professores</h1>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre contas e controle o acesso dos professores.</p>
        </div>
        <Button onClick={() => { setError(null); setFormOpen(true) }}>
          <Plus size={16} />
          Novo professor
        </Button>
      </div>

      {message && <div className="mb-5 flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800"><CheckCircle2 size={17} />{message}</div>}
      {error && <div className="mb-5 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {formOpen && (
        <form onSubmit={handleSubmit(submit)} noValidate className="mb-6 rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Cadastrar professor</h2>
              <p className="mt-1 text-sm text-muted-foreground">A senha temporária será enviada ao e-mail informado.</p>
            </div>
            <Button type="button" variant="ghost" size="icon-sm" aria-label="Fechar formulário" onClick={() => setFormOpen(false)}><X size={17} /></Button>
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <label className="space-y-1.5 text-sm font-medium">
              Nome completo
              <Input
                maxLength={100}
                autoComplete="name"
                aria-invalid={!!errors.nomeCompleto}
                {...register('nomeCompleto', {
                  onChange: (event) => setValue('nomeCompleto', event.target.value.replace(/[^A-Za-zÀ-ÖØ-öø-ÿ\s]/g, '')),
                })}
              />
              {errors.nomeCompleto && <p className="text-xs text-destructive">{errors.nomeCompleto.message}</p>}
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              CPF
              <Input
                inputMode="numeric"
                autoComplete="off"
                maxLength={14}
                placeholder="000.000.000-00"
                aria-invalid={!!errors.cpf}
                {...register('cpf', {
                  onChange: (event) => setValue('cpf', formatCpf(event.target.value), { shouldValidate: true }),
                })}
              />
              {errors.cpf && <p className="text-xs text-destructive">{errors.cpf.message}</p>}
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              E-mail institucional
              <Input
                type="email"
                maxLength={150}
                autoComplete="email"
                aria-invalid={!!errors.email}
                {...register('email', {
                  onChange: (event) => setValue('email', event.target.value.toLowerCase()),
                })}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </label>
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setFormOpen(false)}>Cancelar</Button>
            <Button type="submit" disabled={criar.isPending}>{criar.isPending ? <Loader2 size={16} className="animate-spin" /> : <UserPlus size={16} />}Criar professor</Button>
          </div>
        </form>
      )}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground"><Users size={17} />{professores.length} {professores.length === 1 ? 'professor' : 'professores'}</div>
        <div className="flex rounded-xl border border-border bg-card p-1">
          {(['TODOS', 'ATIVOS', 'INATIVOS'] as StatusFilter[]).map((option) => (
            <button key={option} type="button" onClick={() => setStatus(option)} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${status === option ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
              {option[0] + option.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground"><Loader2 size={24} className="animate-spin" /></div>
      ) : isError ? (
        <div className="rounded-2xl border border-destructive/20 bg-destructive/10 px-5 py-8 text-center text-sm text-destructive">Não foi possível carregar os professores.</div>
      ) : professores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-20 text-center">
          <div className="mb-4 rounded-full bg-primary/10 p-4"><Users size={30} className="text-primary" /></div>
          <h2 className="text-lg font-semibold">Nenhum professor encontrado</h2>
          <p className="mt-1 text-sm text-muted-foreground">Cadastre o primeiro professor para liberar o acesso.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          <div className="divide-y divide-border">
            {professores.map((professor) => (
              <div key={professor.id} className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-3">
                  <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${professor.ativo ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>{professor.nome.charAt(0).toUpperCase()}</div>
                  <div className="min-w-0"><p className="truncate font-medium">{professor.nome}</p><p className="flex items-center gap-1 truncate text-sm text-muted-foreground"><Mail size={13} />{professor.email}</p></div>
                </div>
                <div className="flex items-center gap-3 sm:shrink-0">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${professor.ativo ? 'bg-emerald-100 text-emerald-800' : 'bg-muted text-muted-foreground'}`}>{professor.ativo ? 'Ativo' : 'Inativo'}</span>
                  {professor.mustChangePassword && <span className="hidden rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 md:inline">Troca de senha pendente</span>}
                  <Button variant={professor.ativo ? 'destructive' : 'outline'} size="sm" disabled={alterarStatus.isPending} onClick={() => toggleStatus(professor)}>
                    {alterarStatus.isPending ? <Loader2 size={15} className="animate-spin" /> : professor.ativo ? <ShieldOff size={15} /> : <CheckCircle2 size={15} />}
                    {professor.ativo ? 'Desativar' : 'Reativar'}''
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
