"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Vote, LogOut, Award, Users } from "lucide-react"
import { supabase, type Category, type Nominee, type User, type UserVote, type NomineeCategory } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [nomineeCategories, setNomineeCategories] = useState<NomineeCategory[]>([])
  const [userVotes, setUserVotes] = useState<UserVote[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [votingLoading, setVotingLoading] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (!userData) {
      router.push("/")
      return
    }

    const parsedUser = JSON.parse(userData)
    setUser(parsedUser)
    loadData(parsedUser.id)
  }, [router])

  const loadData = async (userId: string) => {
    try {
      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("created_at")

      if (catError) {
        console.error("Error loading categories:", catError)
        setCategories([])
      } else {
        setCategories(categoriesData || [])
      }

      // Load nominees
      const { data: nomineesData, error: nomError } = await supabase
        .from("nominees")
        .select("*")
        .eq("is_active", true)
        .order("created_at")

      if (nomError) {
        console.error("Error loading nominees:", nomError)
        setNominees([])
      } else {
        setNominees(nomineesData || [])
      }

      // Load nominee-category associations
      const { data: associationsData, error: assocError } = await supabase
        .from("nominee_categories")
        .select("*")
        .order("created_at")

      if (assocError) {
        console.error("Error loading associations:", assocError)
        setNomineeCategories([])
      } else {
        setNomineeCategories(associationsData || [])
      }

      // Load user votes (skip if admin)
      if (userId !== "admin-env-id") {
        const { data: votesData, error: voteError } = await supabase
          .from("user_votes")
          .select("*")
          .eq("user_id", userId)

        if (voteError) {
          console.error("Error loading votes:", voteError)
          setUserVotes([])
        } else {
          setUserVotes(votesData || [])
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const testDatabaseConnection = async () => {
    try {
      console.log("Testing database connection...")

      // Test if individual_votes table exists
      const { data: testData, error: testError } = await supabase.from("individual_votes").select("id").limit(1)

      if (testError) {
        console.error("individual_votes table test failed:", testError)
        return false
      }

      console.log("Database connection test successful")
      return true
    } catch (error) {
      console.error("Database connection test failed:", error)
      return false
    }
  }

  const handleVote = async (categoryId: string, nomineeId: string) => {
    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.")
      return
    }

    setVotingLoading(nomineeId)

    try {
      // Check if user already voted in this category
      const hasVoted = userVotes.some((vote) => vote.category_id === categoryId)
      if (hasVoted) {
        alert("Você já votou nesta categoria!")
        return
      }

      // Test database connection first
      const dbConnected = await testDatabaseConnection()
      if (!dbConnected) {
        alert("Erro de conexão com o banco de dados. Execute o script SQL 008-fix-voting-permissions.sql")
        return
      }

      console.log("Attempting to vote:", {
        user_id: user.id,
        nominee_id: nomineeId,
        category_id: categoryId,
        user_type: typeof user.id,
        nominee_type: typeof nomineeId,
        category_type: typeof categoryId,
      })

      // Record individual vote (new system)
      const { data: individualVoteData, error: individualVoteError } = await supabase
        .from("individual_votes")
        .insert([
          {
            user_id: user.id,
            nominee_id: nomineeId,
            category_id: categoryId,
          },
        ])
        .select()

      if (individualVoteError) {
        console.error("Individual vote error details:", {
          error: individualVoteError,
          code: individualVoteError.code,
          message: individualVoteError.message,
          details: individualVoteError.details,
          hint: individualVoteError.hint,
        })
        throw new Error(`Erro ao registrar voto individual: ${individualVoteError.message}`)
      }

      console.log("Individual vote successful:", individualVoteData)

      // Record user vote (to prevent multiple votes in same category)
      const { data: userVoteData, error: voteError } = await supabase
        .from("user_votes")
        .insert([{ user_id: user.id, category_id: categoryId }])
        .select()

      if (voteError) {
        console.error("User vote error details:", {
          error: voteError,
          code: voteError.code,
          message: voteError.message,
          details: voteError.details,
          hint: voteError.hint,
        })
        throw new Error(`Erro ao registrar controle de voto: ${voteError.message}`)
      }

      console.log("User vote successful:", userVoteData)

      // Reload data
      await loadData(user.id)

      alert("Voto registrado com sucesso!")
    } catch (error) {
      console.error("Error voting:", error)

      // More detailed error message
      let errorMessage = "Erro desconhecido"

      if (error instanceof Error) {
        errorMessage = error.message
      } else if (error?.message) {
        errorMessage = error.message
      } else if (error?.code) {
        errorMessage = `Código de erro: ${error.code}`
      }

      if (errorMessage.includes("relation") && errorMessage.includes("does not exist")) {
        alert("Erro: Tabela de votação não encontrada. Execute o script SQL 008-fix-voting-permissions.sql primeiro.")
      } else if (errorMessage.includes("permission denied") || errorMessage.includes("RLS")) {
        alert("Erro: Permissões insuficientes. Execute o script SQL 008-fix-voting-permissions.sql para corrigir.")
      } else if (errorMessage.includes("duplicate key")) {
        alert("Você já votou nesta categoria!")
      } else {
        alert(`Erro ao registrar voto: ${errorMessage}`)
      }
    } finally {
      setVotingLoading(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const getCategoryNominees = (categoryId: string) => {
    const associatedNominees = nomineeCategories
      .filter((nc) => nc.category_id === categoryId)
      .map((nc) => nominees.find((n) => n.id === nc.nominee_id))
      .filter(Boolean) as Nominee[]

    return associatedNominees
  }

  const hasUserVoted = (categoryId: string) => {
    return userVotes.some((vote) => vote.category_id === categoryId)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <div className="w-8 h-8 spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="dark-header">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Trophy className="h-8 w-8 text-blue-400" />
            <div>
              <h1 className="text-2xl font-bold text-white">Monga Awards</h1>
              <p className="text-slate-400">Bem-vindo, {user?.email}</p>
            </div>
          </div>
          <Button onClick={handleLogout} className="btn-secondary">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-white mb-2">🏆 Votação Aberta 🏆</h2>
          <p className="text-slate-400 text-lg">Vote nos seus favoritos em cada categoria</p>
        </div>

        {categories.length === 0 ? (
          <Card className="text-center py-12 dark-card">
            <CardContent>
              <Award className="h-16 w-16 text-blue-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Nenhuma categoria disponível</h3>
              <p className="text-slate-400">As categorias serão disponibilizadas em breve.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {categories.map((category) => {
              const categoryNominees = getCategoryNominees(category.id)
              const userHasVoted = hasUserVoted(category.id)

              return (
                <Card key={category.id} className="dark-card hover-lift">
                  <CardHeader className="text-center">
                    {category.banner_image && (
                      <div className="mb-4">
                        <Image
                          src={category.banner_image || "/placeholder.svg"}
                          alt={category.name}
                          width={800}
                          height={200}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      </div>
                    )}
                    <CardTitle className="text-2xl text-white flex items-center justify-center gap-2 flex-wrap">
                      {category.name}
                      {userHasVoted && <Badge className="status-voted">✓ Votado</Badge>}
                      {!category.voting_open && <Badge className="status-closed">Votação Fechada</Badge>}
                      {category.voting_open && !userHasVoted && <Badge className="status-open">Aberta</Badge>}
                    </CardTitle>
                    {category.description && (
                      <CardDescription className="text-slate-400">{category.description}</CardDescription>
                    )}
                  </CardHeader>

                  <CardContent>
                    {categoryNominees.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-400">Nenhum indicado nesta categoria ainda.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                        {categoryNominees.map((nominee) => (
                          <Card key={nominee.id} className="dark-card hover-lift">
                            <CardContent className="p-2 sm:p-3 md:p-4">
                              {nominee.image && (
                                <div className="mb-3">
                                  <Image
                                    src={nominee.image || "/placeholder.svg"}
                                    alt={nominee.name}
                                    width={200}
                                    height={200}
                                    className="w-full aspect-square object-cover rounded-lg"
                                  />
                                </div>
                              )}
                              <h4 className="font-semibold text-white mb-2 text-xs">{nominee.name}</h4>
                              {nominee.description && (
                                <p className="text-[10px] text-slate-400 mb-3 line-clamp-2">{nominee.description}</p>
                              )}
                              <div className="flex items-center justify-between">
                                {category.voting_open && !userHasVoted ? (
                                  <Button
                                    onClick={() => handleVote(category.id, nominee.id)}
                                    disabled={votingLoading === nominee.id}
                                    size="sm"
                                    className="btn-primary w-full text-xs"
                                  >
                                    {votingLoading === nominee.id ? (
                                      <div className="flex items-center gap-2">
                                        <div className="w-4 h-4 spinner"></div>
                                        Votando...
                                      </div>
                                    ) : (
                                      <>
                                        <Vote className="h-4 w-4 mr-1" />
                                        Votar
                                      </>
                                    )}
                                  </Button>
                                ) : userHasVoted ? (
                                  <Badge className="status-voted w-full justify-center py-2">Você já votou</Badge>
                                ) : (
                                  <Badge className="status-closed w-full justify-center py-2">Votação fechada</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
