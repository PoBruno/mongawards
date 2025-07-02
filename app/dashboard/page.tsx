"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Trophy, Vote, LogOut, Award, Users, Star, CheckCircle2 } from "lucide-react"
import {
  supabase,
  type Category,
  type Nominee,
  type User,
  type NomineeCategory,
  type UserVotingProgress,
} from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [nomineeCategories, setNomineeCategories] = useState<NomineeCategory[]>([])
  const [userProgress, setUserProgress] = useState<UserVotingProgress[]>([])
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

      // Load nominee-category associations (only needed for phase 2)
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

      // Load user voting progress
      if (userId !== "admin-env-id") {
        const { data: progressData, error: progressError } = await supabase
          .from("user_voting_progress")
          .select("*")
          .eq("user_id", userId)

        if (progressError) {
          console.error("Error loading progress:", progressError)
          setUserProgress([])
        } else {
          setUserProgress(progressData || [])
        }
      }
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePhase1Vote = async (categoryId: string, nomineeId: string) => {
    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.")
      return
    }

    setVotingLoading(nomineeId)

    try {
      // Check current progress
      const currentProgress = userProgress.find((p) => p.category_id === categoryId && p.phase === 1)

      if (currentProgress && currentProgress.votes_cast >= 2) {
        alert("Você já indicou 2 pessoas nesta categoria!")
        return
      }

      // Check if user already voted for this specific nominee in this category
      const { data: existingVote, error: checkError } = await supabase
        .from("phase_1_votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("category_id", categoryId)
        .eq("nominee_id", nomineeId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      if (existingVote) {
        alert("Você já indicou esta pessoa nesta categoria!")
        return
      }

      // Record the vote
      const { error: voteError } = await supabase.from("phase_1_votes").insert([
        {
          user_id: user.id,
          nominee_id: nomineeId,
          category_id: categoryId,
        },
      ])

      if (voteError) throw voteError

      // Update or create progress
      const newVotesCount = (currentProgress?.votes_cast || 0) + 1

      if (currentProgress) {
        const { error: updateError } = await supabase
          .from("user_voting_progress")
          .update({
            votes_cast: newVotesCount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", currentProgress.id)

        if (updateError) throw updateError
      } else {
        const { error: insertError } = await supabase.from("user_voting_progress").insert([
          {
            user_id: user.id,
            category_id: categoryId,
            phase: 1,
            votes_cast: 1,
            max_votes: 2,
          },
        ])

        if (insertError) throw insertError
      }

      // Reload data
      await loadData(user.id)

      alert(`Indicação registrada! (${newVotesCount}/2 para esta categoria)`)
    } catch (error) {
      console.error("Error voting:", error)
      alert("Erro ao registrar indicação. Tente novamente.")
    } finally {
      setVotingLoading(null)
    }
  }

  const handlePhase2Vote = async (categoryId: string, nomineeId: string) => {
    if (!user) {
      alert("Usuário não encontrado. Faça login novamente.")
      return
    }

    setVotingLoading(nomineeId)

    try {
      // Check if user already voted in phase 2 for this category
      const { data: existingVote, error: checkError } = await supabase
        .from("phase_2_votes")
        .select("id")
        .eq("user_id", user.id)
        .eq("category_id", categoryId)
        .single()

      if (checkError && checkError.code !== "PGRST116") {
        throw checkError
      }

      if (existingVote) {
        alert("Você já votou nesta categoria!")
        return
      }

      // Record the vote
      const { error: voteError } = await supabase.from("phase_2_votes").insert([
        {
          user_id: user.id,
          nominee_id: nomineeId,
          category_id: categoryId,
        },
      ])

      if (voteError) throw voteError

      // Update progress
      const { error: progressError } = await supabase.from("user_voting_progress").upsert([
        {
          user_id: user.id,
          category_id: categoryId,
          phase: 2,
          votes_cast: 1,
          max_votes: 1,
        },
      ])

      if (progressError) throw progressError

      // Reload data
      await loadData(user.id)

      alert("Voto registrado com sucesso!")
    } catch (error) {
      console.error("Error voting:", error)
      alert("Erro ao registrar voto. Tente novamente.")
    } finally {
      setVotingLoading(null)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const getCategoryNominees = (categoryId: string, phase: number) => {
    if (phase === 1) {
      // Phase 1: All nominees are available
      return nominees
    } else {
      // Phase 2: Only linked nominees
      const associatedNominees = nomineeCategories
        .filter((nc) => nc.category_id === categoryId)
        .map((nc) => nominees.find((n) => n.id === nc.nominee_id))
        .filter(Boolean) as Nominee[]
      return associatedNominees
    }
  }

  const getUserProgress = (categoryId: string, phase: number) => {
    return userProgress.find((p) => p.category_id === categoryId && p.phase === phase)
  }

  const hasUserVotedForNominee = (categoryId: string, nomineeId: string, phase: number) => {
    // This would need to be checked via additional state or API call
    // For now, we'll rely on the progress tracking
    return false
  }

  const getPhaseTitle = (category: Category) => {
    if (category.phase_1_active) {
      return "🗳️ Fase 1 - Indicação"
    } else if (category.phase_2_active) {
      return "🏆 Fase 2 - Votação Final"
    } else if (category.is_finalized) {
      return "✅ Finalizada"
    } else {
      return "⏳ Aguardando"
    }
  }

  const getPhaseDescription = (category: Category) => {
    if (category.phase_1_active) {
      return "Indique 2 pessoas para esta categoria"
    } else if (category.phase_2_active) {
      return "Vote no seu favorito"
    } else if (category.is_finalized) {
      return "Votação encerrada"
    } else {
      return "Votação ainda não iniciada"
    }
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
          <h2 className="text-4xl font-bold text-white mb-2">🏆 Sistema de Votação em Duas Fases 🏆</h2>
          <p className="text-slate-400 text-lg">
            <strong>Fase 1:</strong> Indique 2 pessoas por categoria | <strong>Fase 2:</strong> Vote no seu favorito
          </p>
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
              const isPhase1Active = category.phase_1_active
              const isPhase2Active = category.phase_2_active
              const currentPhase = isPhase1Active ? 1 : isPhase2Active ? 2 : 0
              const categoryNominees = getCategoryNominees(category.id, currentPhase)
              const progress = getUserProgress(category.id, currentPhase)

              if (!isPhase1Active && !isPhase2Active) {
                return (
                  <Card key={category.id} className="dark-card">
                    <CardHeader className="text-center">
                      <CardTitle className="text-xl text-white flex items-center justify-center gap-2">
                        {category.name}
                        <Badge className="bg-gray-500/20 text-gray-400">
                          {category.is_finalized ? "Finalizada" : "Aguardando"}
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-slate-400">
                        {category.is_finalized ? "Votação encerrada" : "Votação ainda não iniciada"}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                )
              }

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
                      <Badge
                        className={isPhase1Active ? "bg-blue-500/20 text-blue-400" : "bg-green-500/20 text-green-400"}
                      >
                        {getPhaseTitle(category)}
                      </Badge>
                      {progress && (
                        <Badge className="status-voted">
                          {progress.votes_cast}/{progress.max_votes} votos
                        </Badge>
                      )}
                    </CardTitle>
                    {category.description && (
                      <CardDescription className="text-slate-400">{category.description}</CardDescription>
                    )}
                    <CardDescription className="text-slate-300 font-medium">
                      {getPhaseDescription(category)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    {categoryNominees.length === 0 ? (
                      <div className="text-center py-8">
                        <Users className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                        <p className="text-slate-400">
                          {isPhase2Active ? "Nenhum finalista selecionado ainda." : "Nenhum indicado disponível."}
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-5 gap-2 sm:gap-3 md:gap-4">
                        {categoryNominees.map((nominee) => {
                          const canVote = isPhase1Active
                            ? !progress || progress.votes_cast < 2
                            : !progress || progress.votes_cast < 1

                          return (
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
                                  {canVote ? (
                                    <Button
                                      onClick={() =>
                                        isPhase1Active
                                          ? handlePhase1Vote(category.id, nominee.id)
                                          : handlePhase2Vote(category.id, nominee.id)
                                      }
                                      disabled={votingLoading === nominee.id}
                                      size="sm"
                                      className="btn-primary w-full text-xs"
                                    >
                                      {votingLoading === nominee.id ? (
                                        <div className="flex items-center gap-2">
                                          <div className="w-4 h-4 spinner"></div>
                                          {isPhase1Active ? "Indicando..." : "Votando..."}
                                        </div>
                                      ) : (
                                        <>
                                          {isPhase1Active ? (
                                            <>
                                              <Star className="h-4 w-4 mr-1" />
                                              Indicar
                                            </>
                                          ) : (
                                            <>
                                              <Vote className="h-4 w-4 mr-1" />
                                              Votar
                                            </>
                                          )}
                                        </>
                                      )}
                                    </Button>
                                  ) : (
                                    <Badge className="status-voted w-full justify-center py-2">
                                      {isPhase1Active ? (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Indicações completas
                                        </>
                                      ) : (
                                        <>
                                          <CheckCircle2 className="h-3 w-3 mr-1" />
                                          Você já votou
                                        </>
                                      )}
                                    </Badge>
                                  )}
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
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
