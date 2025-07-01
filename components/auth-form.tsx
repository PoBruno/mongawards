"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, AlertCircle, Info } from "lucide-react"
import { signIn, signUp } from "@/lib/auth"
import { useRouter } from "next/navigation"

export default function AuthForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    const { user, error } = await signIn(email, password)

    if (error) {
      setError(error)
    } else if (user) {
      localStorage.setItem("user", JSON.stringify(user))
      if (user.is_admin) {
        router.push("/admin")
      } else {
        router.push("/dashboard")
      }
    }

    setIsLoading(false)
  }

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string
    const secretCode = formData.get("secretCode") as string

    const { user, error } = await signUp(email, password, secretCode)

    if (error) {
      setError(error)
    } else if (user) {
      localStorage.setItem("user", JSON.stringify(user))
      router.push("/dashboard")
    }

    setIsLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md dark-card hover-lift">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Trophy className="h-16 w-16 text-blue-400" />
          </div>
          <div>
            <CardTitle className="text-3xl font-bold text-white">Monga Awards</CardTitle>
            <CardDescription className="text-slate-400">Sistema de Votação para Premiações</CardDescription>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          <Tabs defaultValue="signin" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 dark-tabs">
              <TabsTrigger value="signin" className="dark-tab">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="dark-tab">
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="dark-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-slate-300">
                    Senha
                  </Label>
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="dark-input"
                  />
                </div>
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 spinner"></div>
                      Entrando...
                    </div>
                  ) : (
                    "Entrar"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-slate-300">
                    Email
                  </Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    placeholder="seu@email.com"
                    required
                    className="dark-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-slate-300">
                    Senha
                  </Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    required
                    className="dark-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="secretCode" className="text-slate-300">
                    Código de Acesso
                  </Label>
                  <Input
                    id="secretCode"
                    name="secretCode"
                    type="text"
                    placeholder="Código fornecido pela organização"
                    required
                    className="dark-input"
                  />
                </div>
                {error && (
                  <div className="bg-red-500/20 border border-red-500/30 text-red-400 p-3 rounded-lg flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                  </div>
                )}
                <Button type="submit" className="w-full btn-primary" disabled={isLoading}>
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 spinner"></div>
                      Cadastrando...
                    </div>
                  ) : (
                    "Cadastrar"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
