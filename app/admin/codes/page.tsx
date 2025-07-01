"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Trophy, Plus, Copy, Trash2, ArrowLeft, Key, Users, CheckCircle, XCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

type SecretCode = {
  id: string
  code: string
  is_used: boolean
  used_by: string | null
  created_at: string
}

type User = {
  id: string
  email: string
  is_admin: boolean
  created_at: string
}

export default function CodesManagement() {
  const [user, setUser] = useState<User | null>(null)
  const [codes, setCodes] = useState<SecretCode[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [newCode, setNewCode] = useState("")
  const [isGenerating, setIsGenerating] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    if (!parsedUser.is_admin) {
      router.push("/dashboard")
      return
    }

    setUser(parsedUser)
    loadCodes()
  }, [router])

  const loadCodes = async () => {
    try {
      const { data: codesData, error } = await supabase
        .from("secret_codes")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) {
        console.error("Error loading codes:", error)
        setCodes([])
      } else {
        setCodes(codesData || [])
      }
    } catch (error) {
      console.error("Error loading codes:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateRandomCode = () => {
    const prefix = "MONGA"
    const year = new Date().getFullYear()
    const random = Math.random().toString(36).substring(2, 8).toUpperCase()
    return `${prefix}${year}_${random}`
  }

  const handleCreateCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsGenerating(true)

    try {
      const codeToCreate = newCode || generateRandomCode()

      const { error } = await supabase.from("secret_codes").insert([{ code: codeToCreate }])

      if (error) {
        if (error.code === "23505") {
          alert("Este código já existe. Tente outro.")
        } else {
          throw error
        }
      } else {
        setIsDialogOpen(false)
        setNewCode("")
        loadCodes()
        alert("Código criado com sucesso!")
      }
    } catch (error) {
      console.error("Error creating code:", error)
      alert("Erro ao criar código")
    } finally {
      setIsGenerating(false)
    }
  }

  const handleDeleteCode = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este código?")) {
      return
    }

    try {
      const { error } = await supabase.from("secret_codes").delete().eq("id", id)

      if (error) throw error

      loadCodes()
      alert("Código excluído!")
    } catch (error) {
      console.error("Error deleting code:", error)
      alert("Erro ao excluir código")
    }
  }

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      alert("Código copiado para a área de transferência!")
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      alert("Erro ao copiar código")
    }
  }

  const getUsageStats = () => {
    const total = codes.length
    const used = codes.filter((c) => c.is_used).length
    const available = total - used
    return { total, used, available }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <div className="w-8 h-8 spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando códigos...</p>
        </div>
      </div>
    )
  }

  const stats = getUsageStats()

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="dark-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Key className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Gerenciar Códigos de Acesso</h1>
              <p className="text-slate-400">Controle de acesso ao sistema</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => router.push("/admin")} className="btn-secondary">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Admin
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <Key className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.total}</div>
              <div className="text-sm text-slate-400">Total de Códigos</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.available}</div>
              <div className="text-sm text-slate-400">Códigos Disponíveis</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{stats.used}</div>
              <div className="text-sm text-slate-400">Códigos Utilizados</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">Códigos de Acesso</h2>
          <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
            <Plus className="h-4 w-4 mr-2" />
            Novo Código
          </Button>
        </div>

        {codes.length === 0 ? (
          <Card className="text-center py-12 dark-card">
            <CardContent>
              <Key className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhum código criado</h3>
              <p className="text-slate-400 mb-4">
                Crie códigos de acesso para permitir que usuários se cadastrem no sistema.
              </p>
              <Button onClick={() => setIsDialogOpen(true)} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeiro Código
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {codes.map((code) => (
              <Card key={code.id} className="dark-card hover-lift">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-700">
                        {code.is_used ? (
                          <XCircle className="h-6 w-6 text-red-400" />
                        ) : (
                          <CheckCircle className="h-6 w-6 text-green-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <code className="text-lg font-mono font-bold text-white bg-slate-700 px-3 py-1 rounded">
                            {code.code}
                          </code>
                          <Badge className={code.is_used ? "status-closed" : "status-open"}>
                            {code.is_used ? "Utilizado" : "Disponível"}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-400">
                          Criado em: {new Date(code.created_at).toLocaleDateString("pt-BR")}
                        </p>
                        {code.is_used && (
                          <p className="text-xs text-slate-500">Código já foi utilizado por um usuário</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button onClick={() => copyToClipboard(code.code)} size="sm" className="btn-secondary">
                        <Copy className="h-4 w-4" />
                      </Button>
                      {!code.is_used && (
                        <Button
                          onClick={() => handleDeleteCode(code.id)}
                          size="sm"
                          className="btn-secondary text-red-400 hover:text-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Create Code Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md dark-card border-slate-600">
          <DialogHeader>
            <DialogTitle className="text-white">Criar Novo Código de Acesso</DialogTitle>
            <DialogDescription className="text-slate-400">
              Crie um código personalizado ou deixe em branco para gerar automaticamente.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateCode} className="space-y-4">
            <div>
              <Label htmlFor="new-code" className="text-slate-300">
                Código (opcional)
              </Label>
              <Input
                id="new-code"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                placeholder="Deixe vazio para gerar automaticamente"
                className="dark-input font-mono"
              />
              <p className="text-xs text-slate-400 mt-1">Se deixar vazio, será gerado: {generateRandomCode()}</p>
            </div>

            <div className="flex justify-end space-x-2">
              <Button type="button" onClick={() => setIsDialogOpen(false)} className="btn-secondary">
                Cancelar
              </Button>
              <Button type="submit" className="btn-primary" disabled={isGenerating}>
                {isGenerating ? "Criando..." : "Criar Código"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
