"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Database, Play, Settings, Key } from "lucide-react"

export default function SetupNotice() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl dark-card hover-lift">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertTriangle className="h-16 w-16 text-orange-400" />
          </div>
          <CardTitle className="text-2xl text-white">Configuração Necessária</CardTitle>
          <CardDescription className="text-slate-400">
            Para usar o Monga Awards, você precisa configurar o banco de dados e as variáveis de ambiente.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="dark-card p-6 rounded-lg">
            <h3 className="font-semibold text-blue-400 mb-3 flex items-center">
              <Database className="h-5 w-5 mr-2" />
              1. Configuração do Banco de Dados
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-slate-300 text-sm">
              <li>Configure as variáveis de ambiente do Supabase</li>
              <li>
                Execute o script SQL:{" "}
                <code className="bg-slate-700 px-2 py-1 rounded text-blue-400">scripts/005-production-setup.sql</code>
              </li>
              <li>As tabelas serão criadas automaticamente</li>
            </ol>
          </div>

          <div className="dark-card p-6 rounded-lg">
            <h3 className="font-semibold text-green-400 mb-3 flex items-center">
              <Key className="h-5 w-5 mr-2" />
              2. Configuração do Administrador
            </h3>
            <div className="space-y-3">
              <p className="text-slate-300 text-sm">Configure as seguintes variáveis de ambiente:</p>
              <div className="bg-slate-800 p-3 rounded font-mono text-sm">
                <p className="text-green-400">NEXT_PUBLIC_USER_ADMIN=admin@seuemail.com</p>
                <p className="text-green-400">NEXT_PUBLIC_USER_PASSWORD=suasenhasegura</p>
              </div>
            </div>
          </div>

          <div className="dark-card p-6 rounded-lg">
            <h3 className="font-semibold text-purple-400 mb-3 flex items-center">
              <Settings className="h-5 w-5 mr-2" />
              3. Configuração dos Códigos de Acesso
            </h3>
            <div className="text-slate-300 text-sm space-y-2">
              <p>Após a configuração inicial:</p>
              <ul className="space-y-1 ml-4">
                <li>• Acesse o painel administrativo</li>
                <li>• Crie códigos de acesso para os usuários</li>
                <li>• Configure as categorias e indicados</li>
              </ul>
            </div>
          </div>

          <div className="text-center">
            <Button onClick={() => window.location.reload()} className="btn-primary px-8">
              <Play className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
