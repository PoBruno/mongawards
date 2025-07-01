"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Trophy, Crown, Medal, Award, ArrowLeft, TrendingUp, Users, BarChart3, Eye, Vote } from "lucide-react"
import { supabase, type Category, type Nominee, type User, type NomineeCategory } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Image from "next/image"

export default function ResultsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [allCategories, setAllCategories] = useState<Category[]>([])
  const [closedCategories, setClosedCategories] = useState<Category[]>([])
  const [openCategories, setOpenCategories] = useState<Category[]>([])
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [nomineeCategories, setNomineeCategories] = useState<NomineeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
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
    loadData()
  }, [router])

  const loadData = async () => {
    try {
      // Load all categories
      const { data: categoriesData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true)
        .order("created_at")

      if (catError) {
        console.error("Error loading categories:", catError)
        setAllCategories([])
        setClosedCategories([])
        setOpenCategories([])
      } else {
        const categories = categoriesData || []
        setAllCategories(categories)
        setClosedCategories(categories.filter((c) => !c.voting_open))
        setOpenCategories(categories.filter((c) => c.voting_open))
      }

      // Load nominees
      const { data: nomineesData, error: nomError } = await supabase
        .from("nominees")
        .select("*")
        .eq("is_active", true)
        .order("vote_count", { ascending: false })

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
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const getCategoryNominees = (categoryId: string) => {
    const associatedNominees = nomineeCategories
      .filter((nc) => nc.category_id === categoryId)
      .map((nc) => nominees.find((n) => n.id === nc.nominee_id))
      .filter(Boolean) as Nominee[]

    return associatedNominees.sort((a, b) => b.vote_count - a.vote_count)
  }

  const getTotalVotes = () => {
    return nominees.reduce((total, nominee) => total + nominee.vote_count, 0)
  }

  const getPositionIcon = (position: number) => {
    switch (position) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-400" />
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />
      case 3:
        return <Award className="h-5 w-5 text-orange-400" />
      default:
        return <div className="h-5 w-5 flex items-center justify-center text-slate-400 font-bold">{position}</div>
    }
  }

  const renderCategoryResults = (categories: Category[], showWinners = false) => {
    if (categories.length === 0) {
      return (
        <Card className="text-center py-12 dark-card">
          <CardContent>
            <Trophy className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">
              {showWinners ? "Nenhum resultado disponível" : "Nenhuma votação em andamento"}
            </h3>
            <p className="text-slate-400">
              {showWinners
                ? "Os resultados aparecerão aqui quando as votações das categorias forem encerradas."
                : "Não há categorias com votação aberta no momento."}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <div className="space-y-6">
        {categories.map((category) => {
          const categoryNominees = getCategoryNominees(category.id)
          const totalCategoryVotes = categoryNominees.reduce((sum, nominee) => sum + nominee.vote_count, 0)

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
                  <Trophy className="h-6 w-6 text-blue-400" />
                  {category.name}
                  <Badge className={category.voting_open ? "status-open" : "status-closed"}>
                    {category.voting_open ? "🟢 Votação Aberta" : "🔴 Votação Encerrada"}
                  </Badge>
                </CardTitle>
                {category.description && (
                  <CardDescription className="text-slate-400">{category.description}</CardDescription>
                )}
                <div className="text-sm text-slate-400 mt-2">
                  Total de votos nesta categoria: <strong className="text-white">{totalCategoryVotes}</strong>
                </div>
              </CardHeader>

              <CardContent>
                {categoryNominees.length === 0 ? (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-400">Nenhum indicado nesta categoria.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {categoryNominees.map((nominee, index) => {
                      const position = index + 1
                      const percentage = totalCategoryVotes > 0 ? (nominee.vote_count / totalCategoryVotes) * 100 : 0
                      const isWinner = position === 1 && !category.voting_open

                      return (
                        <Card
                          key={nominee.id}
                          className={`dark-card border-2 ${
                            isWinner
                              ? "border-yellow-400/50 bg-yellow-400/5"
                              : position === 2 && !category.voting_open
                                ? "border-gray-400/50 bg-gray-400/5"
                                : position === 3 && !category.voting_open
                                  ? "border-orange-400/50 bg-orange-400/5"
                                  : category.voting_open
                                    ? "border-blue-400/30"
                                    : "border-slate-600/30"
                          }`}
                        >
                          <CardContent className="p-4">
                            <div className="flex items-center space-x-4">
                              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700">
                                {showWinners && !category.voting_open ? (
                                  getPositionIcon(position)
                                ) : (
                                  <div className="text-sm font-bold text-slate-300">#{position}</div>
                                )}
                              </div>

                              {nominee.image && (
                                <div className="flex-shrink-0">
                                  <Image
                                    src={nominee.image || "/placeholder.svg"}
                                    alt={nominee.name}
                                    width={60}
                                    height={60}
                                    className="w-15 h-15 object-cover rounded-lg"
                                  />
                                </div>
                              )}

                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                  <h4 className="font-bold text-white">{nominee.name}</h4>
                                  {showWinners && !category.voting_open && position <= 3 && (
                                    <Badge
                                      className={
                                        position === 1
                                          ? "bg-yellow-400/20 text-yellow-400 border-yellow-400/30"
                                          : position === 2
                                            ? "bg-gray-400/20 text-gray-400 border-gray-400/30"
                                            : "bg-orange-400/20 text-orange-400 border-orange-400/30"
                                      }
                                    >
                                      {position === 1 ? "🥇 1º Lugar" : position === 2 ? "🥈 2º Lugar" : "🥉 3º Lugar"}
                                    </Badge>
                                  )}
                                  {category.voting_open && <Badge className="status-open">Em votação</Badge>}
                                </div>
                                {nominee.description && (
                                  <p className="text-sm text-slate-400 mb-2">{nominee.description}</p>
                                )}
                                <div className="flex items-center gap-4">
                                  <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
                                    <Vote className="h-3 w-3 mr-1" />
                                    {nominee.vote_count} votos ({percentage.toFixed(1)}%)
                                  </Badge>
                                  <div className="flex-1 bg-slate-700 rounded-full h-2">
                                    <div
                                      className={`h-2 rounded-full progress-bar ${isWinner ? "progress-winner" : ""}`}
                                      style={{ width: `${Math.max(percentage, 2)}%` }}
                                    ></div>
                                  </div>
                                </div>
                              </div>
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
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <div className="w-8 h-8 spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando resultados...</p>
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
              <h1 className="text-2xl font-bold text-white">Monga Awards - Resultados</h1>
              <p className="text-slate-400">Visão Geral Completa das Votações</p>
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <Award className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{allCategories.length}</div>
              <div className="text-sm text-slate-400">Total de Categorias</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <Trophy className="h-8 w-8 text-red-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{closedCategories.length}</div>
              <div className="text-sm text-slate-400">Votações Encerradas</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <Vote className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{openCategories.length}</div>
              <div className="text-sm text-slate-400">Votações Abertas</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{getTotalVotes()}</div>
              <div className="text-sm text-slate-400">Total de Votos</div>
            </CardContent>
          </Card>
        </div>

        {/* Results Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 dark-tabs">
            <TabsTrigger value="overview" className="dark-tab">
              <Eye className="h-4 w-4 mr-2" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="results" className="dark-tab">
              <Trophy className="h-4 w-4 mr-2" />
              Resultados Oficiais
            </TabsTrigger>
            <TabsTrigger value="ongoing" className="dark-tab">
              <BarChart3 className="h-4 w-4 mr-2" />
              Votações Abertas
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">📊 Visão Geral Completa</h2>
              <p className="text-slate-400">Todas as categorias e seus respectivos votos</p>
            </div>
            {renderCategoryResults(allCategories, false)}
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">🏆 Resultados Oficiais</h2>
              <p className="text-slate-400">Vencedores das categorias com votação encerrada</p>
            </div>
            {renderCategoryResults(closedCategories, true)}
          </TabsContent>

          <TabsContent value="ongoing" className="space-y-4">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-white mb-2">🗳️ Votações em Andamento</h2>
              <p className="text-slate-400">Acompanhe as votações que ainda estão abertas</p>
            </div>
            {renderCategoryResults(openCategories, false)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
