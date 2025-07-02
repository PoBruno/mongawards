"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Trophy,
  Plus,
  Edit,
  Trash2,
  Users,
  BarChart3,
  LogOut,
  Star,
  Award,
  Link2,
  TrendingUp,
  Key,
  Crown,
  Medal,
} from "lucide-react"
import { supabase, type Category, type Nominee, type User, type NomineeCategory } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Image from "next/image"
import ImageUpload from "@/components/image-upload"
import { deleteImageClient } from "@/lib/blob-client"

type Phase1Result = {
  nominee_id: string
  nominee_name: string
  nominee_image?: string
  vote_count: number
}

export default function AdminPanel() {
  const [user, setUser] = useState<User | null>(null)
  const [categories, setCategories] = useState<Category[]>([])
  const [nominees, setNominees] = useState<Nominee[]>([])
  const [nomineeCategories, setNomineeCategories] = useState<NomineeCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("categories")
  const router = useRouter()

  // Form states
  const [categoryForm, setCategoryForm] = useState({
    id: "",
    name: "",
    description: "",
    banner_image: "",
    is_active: true,
    voting_open: false,
    voting_phase: 1,
    phase_1_active: false,
    phase_2_active: false,
    is_finalized: false,
  })

  const [nomineeForm, setNomineeForm] = useState({
    id: "",
    name: "",
    description: "",
    image: "",
    is_active: true,
  })

  const [associationForm, setAssociationForm] = useState({
    nominee_id: "",
    category_ids: [] as string[],
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [dialogType, setDialogType] = useState<"category" | "nominee" | "association" | "phase1-results">("category")
  const [editingId, setEditingId] = useState<string | null>(null)

  const [phaseResults, setPhaseResults] = useState<Phase1Result[]>([])
  const [selectedCategoryForResults, setSelectedCategoryForResults] = useState<Category | null>(null)

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
      // Load categories
      const { data: categoriesData, error: catError } = await supabase
        .from("categories")
        .select("*")
        .order("created_at")

      if (catError) {
        console.error("Error loading categories:", catError)
        setCategories([])
      } else {
        setCategories(categoriesData || [])
      }

      // Load nominees
      const { data: nomineesData, error: nomError } = await supabase.from("nominees").select("*").order("created_at")

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

  const handleLogout = () => {
    localStorage.removeItem("user")
    router.push("/")
  }

  const resetCategoryForm = () => {
    setCategoryForm({
      id: "",
      name: "",
      description: "",
      banner_image: "",
      is_active: true,
      voting_open: false,
      voting_phase: 1,
      phase_1_active: false,
      phase_2_active: false,
      is_finalized: false,
    })
    setEditingId(null)
  }

  const resetNomineeForm = () => {
    setNomineeForm({
      id: "",
      name: "",
      description: "",
      image: "",
      is_active: true,
    })
    setEditingId(null)
  }

  const resetAssociationForm = () => {
    setAssociationForm({
      nominee_id: "",
      category_ids: [],
    })
    setEditingId(null)
  }

  const openCategoryDialog = (category?: Category) => {
    if (category) {
      setCategoryForm({
        id: category.id,
        name: category.name ?? "",
        description: category.description ?? "",
        banner_image: category.banner_image ?? "",
        is_active: category.is_active,
        voting_open: category.voting_open,
        voting_phase: category.voting_phase ?? 1,
        phase_1_active: category.phase_1_active ?? false,
        phase_2_active: category.phase_2_active ?? false,
        is_finalized: category.is_finalized ?? false,
      })
      setEditingId(category.id)
    } else {
      resetCategoryForm()
    }
    setDialogType("category")
    setIsDialogOpen(true)
  }

  const openNomineeDialog = (nominee?: Nominee) => {
    if (nominee) {
      setNomineeForm({
        id: nominee.id,
        name: nominee.name ?? "",
        description: nominee.description ?? "",
        image: nominee.image ?? "",
        is_active: nominee.is_active,
      })
      setEditingId(nominee.id)
    } else {
      resetNomineeForm()
    }
    setDialogType("nominee")
    setIsDialogOpen(true)
  }

  const openAssociationDialog = (nominee?: Nominee) => {
    if (nominee) {
      const currentAssociations = nomineeCategories
        .filter((nc) => nc.nominee_id === nominee.id)
        .map((nc) => nc.category_id)

      setAssociationForm({
        nominee_id: nominee.id,
        category_ids: currentAssociations,
      })
      setEditingId(nominee.id)
    } else {
      resetAssociationForm()
    }
    setDialogType("association")
    setIsDialogOpen(true)
  }

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("categories")
          .update({
            name: categoryForm.name,
            description: categoryForm.description,
            banner_image: categoryForm.banner_image,
            is_active: categoryForm.is_active,
            voting_open: categoryForm.voting_open,
            voting_phase: categoryForm.voting_phase,
            phase_1_active: categoryForm.phase_1_active,
            phase_2_active: categoryForm.phase_2_active,
            is_finalized: categoryForm.is_finalized,
          })
          .eq("id", editingId)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase.from("categories").insert([
          {
            name: categoryForm.name,
            description: categoryForm.description,
            banner_image: categoryForm.banner_image,
            is_active: categoryForm.is_active,
            voting_open: categoryForm.voting_open,
            voting_phase: categoryForm.voting_phase,
            phase_1_active: categoryForm.phase_1_active,
            phase_2_active: categoryForm.phase_2_active,
            is_finalized: categoryForm.is_finalized,
          },
        ])

        if (error) throw error
      }

      setIsDialogOpen(false)
      resetCategoryForm()
      loadData()
      alert(editingId ? "Categoria atualizada!" : "Categoria criada!")
    } catch (error) {
      console.error("Error saving category:", error)
      alert("Erro ao salvar categoria")
    }
  }

  const handleNomineeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      if (editingId) {
        // Update
        const { error } = await supabase
          .from("nominees")
          .update({
            name: nomineeForm.name,
            description: nomineeForm.description,
            image: nomineeForm.image,
            is_active: nomineeForm.is_active,
          })
          .eq("id", editingId)

        if (error) throw error
      } else {
        // Create
        const { error } = await supabase.from("nominees").insert([
          {
            name: nomineeForm.name,
            description: nomineeForm.description,
            image: nomineeForm.image,
            is_active: nomineeForm.is_active,
          },
        ])

        if (error) throw error
      }

      setIsDialogOpen(false)
      resetNomineeForm()
      loadData()
      alert(editingId ? "Indicado atualizado!" : "Indicado criado!")
    } catch (error) {
      console.error("Error saving nominee:", error)
      alert("Erro ao salvar indicado")
    }
  }

  const handleAssociationSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      // Remove existing associations for this nominee
      const { error: deleteError } = await supabase
        .from("nominee_categories")
        .delete()
        .eq("nominee_id", associationForm.nominee_id)

      if (deleteError) throw deleteError

      // Add new associations
      if (associationForm.category_ids.length > 0) {
        const associations = associationForm.category_ids.map((categoryId) => ({
          nominee_id: associationForm.nominee_id,
          category_id: categoryId,
        }))

        const { error: insertError } = await supabase.from("nominee_categories").insert(associations)

        if (insertError) throw insertError
      }

      setIsDialogOpen(false)
      resetAssociationForm()
      loadData()
      alert("Associações atualizadas!")
    } catch (error) {
      console.error("Error saving associations:", error)
      alert("Erro ao salvar associações")
    }
  }

  const handleDeleteCategory = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta categoria? Todos os indicados também serão excluídos.")) {
      return
    }

    try {
      // Get category to delete image
      const category = categories.find((c) => c.id === id)

      const { error } = await supabase.from("categories").delete().eq("id", id)

      if (error) throw error

      // Delete image from blob if exists
      if (category?.banner_image) {
        try {
          await deleteImageClient(category.banner_image)
        } catch (error) {
          console.error("Error deleting category image:", error)
        }
      }

      loadData()
      alert("Categoria excluída!")
    } catch (error) {
      console.error("Error deleting category:", error)
      alert("Erro ao excluir categoria")
    }
  }

  const handleDeleteNominee = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este indicado?")) {
      return
    }

    try {
      // Get nominee to delete image
      const nominee = nominees.find((n) => n.id === id)

      const { error } = await supabase.from("nominees").delete().eq("id", id)

      if (error) throw error

      // Delete image from blob if exists
      if (nominee?.image) {
        try {
          await deleteImageClient(nominee.image)
        } catch (error) {
          console.error("Error deleting nominee image:", error)
        }
      }

      loadData()
      alert("Indicado excluído!")
    } catch (error) {
      console.error("Error deleting nominee:", error)
      alert("Erro ao excluir indicado")
    }
  }

  const getCategoryNominees = (categoryId: string) => {
    const associatedNominees = nomineeCategories
      .filter((nc) => nc.category_id === categoryId)
      .map((nc) => nominees.find((n) => n.id === nc.nominee_id))
      .filter(Boolean) as Nominee[]

    return associatedNominees
  }

  const getNomineeCategories = (nomineeId: string) => {
    const associatedCategories = nomineeCategories
      .filter((nc) => nc.nominee_id === nomineeId)
      .map((nc) => categories.find((c) => c.id === nc.category_id))
      .filter(Boolean) as Category[]

    return associatedCategories
  }

  const getTotalVotes = () => {
    return nominees.reduce((total, nominee) => total + nominee.vote_count, 0)
  }

  const handleCategoryToggle = (categoryId: string, checked: boolean) => {
    if (checked) {
      setAssociationForm({
        ...associationForm,
        category_ids: [...associationForm.category_ids, categoryId],
      })
    } else {
      setAssociationForm({
        ...associationForm,
        category_ids: associationForm.category_ids.filter((id) => id !== categoryId),
      })
    }
  }

  const loadPhase1Results = async (category: Category) => {
    try {
      // Direct query for phase 1 results
      const { data, error } = await supabase
        .from("nominees")
        .select(`
          id,
          name,
          image,
          phase_1_votes!left(id)
        `)
        .eq("is_active", true)
        .eq("phase_1_votes.category_id", category.id)

      if (error) {
        console.error("Error loading phase 1 results:", error)
        throw error
      }

      // Process the results to count votes
      const results: Phase1Result[] = (data || []).map((nominee: any) => ({
        nominee_id: nominee.id,
        nominee_name: nominee.name,
        nominee_image: nominee.image,
        vote_count: nominee.phase_1_votes?.length || 0,
      }))

      // Sort by vote count descending
      results.sort((a, b) => b.vote_count - a.vote_count)

      setPhaseResults(results)
      setSelectedCategoryForResults(category)
      setDialogType("phase1-results")
      setIsDialogOpen(true)
    } catch (error) {
      console.error("Error loading phase 1 results:", error)
      alert("Erro ao carregar resultados da Fase 1")
    }
  }

  const selectFinalists = async (selectedNominees: string[]) => {
    if (!selectedCategoryForResults) return

    try {
      // Remove existing associations for this category
      const { error: deleteError } = await supabase
        .from("nominee_categories")
        .delete()
        .eq("category_id", selectedCategoryForResults.id)

      if (deleteError) throw deleteError

      // Add selected nominees as finalists
      if (selectedNominees.length > 0) {
        const associations = selectedNominees.map((nomineeId) => ({
          nominee_id: nomineeId,
          category_id: selectedCategoryForResults.id,
        }))

        const { error: insertError } = await supabase.from("nominee_categories").insert(associations)

        if (insertError) throw insertError
      }

      setIsDialogOpen(false)
      loadData()
      alert(`${selectedNominees.length} finalistas selecionados! Agora você pode iniciar a Fase 2.`)
    } catch (error) {
      console.error("Error selecting finalists:", error)
      alert("Erro ao selecionar finalistas")
    }
  }

  const startPhase1 = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          voting_phase: 1,
          phase_1_active: true,
          phase_2_active: false,
          is_finalized: false,
        })
        .eq("id", categoryId)

      if (error) throw error

      loadData()
      alert("Fase 1 (Indicação) iniciada!")
    } catch (error) {
      console.error("Error starting phase 1:", error)
      alert("Erro ao iniciar Fase 1")
    }
  }

  const finishPhase1 = async (categoryId: string) => {
    if (
      !confirm("Tem certeza que deseja finalizar a Fase 1? Você poderá ver os resultados e selecionar os finalistas.")
    ) {
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          phase_1_active: false,
        })
        .eq("id", categoryId)

      if (error) throw error

      // Show phase 1 results
      const category = categories.find((c) => c.id === categoryId)
      if (category) {
        await loadPhase1Results(category)
      }
      loadData()
    } catch (error) {
      console.error("Error finishing phase 1:", error)
      alert("Erro ao finalizar Fase 1")
    }
  }

  const startPhase2 = async (categoryId: string) => {
    try {
      const { error } = await supabase
        .from("categories")
        .update({
          voting_phase: 2,
          phase_2_active: true,
          phase_1_active: false,
        })
        .eq("id", categoryId)

      if (error) throw error

      loadData()
      alert("Fase 2 (Votação Final) iniciada!")
    } catch (error) {
      console.error("Error starting phase 2:", error)
      alert("Erro ao iniciar Fase 2")
    }
  }

  const finishPhase2 = async (categoryId: string) => {
    if (!confirm("Tem certeza que deseja finalizar esta categoria? Isso encerrará definitivamente a votação.")) {
      return
    }

    try {
      const { error } = await supabase
        .from("categories")
        .update({
          phase_2_active: false,
          is_finalized: true,
        })
        .eq("id", categoryId)

      if (error) throw error

      loadData()
      alert("Categoria finalizada!")
    } catch (error) {
      console.error("Error finishing phase 2:", error)
      alert("Erro ao finalizar categoria")
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Trophy className="h-16 w-16 text-blue-400 mx-auto mb-4" />
          <div className="w-8 h-8 spinner mx-auto mb-4"></div>
          <p className="text-slate-400">Carregando painel admin...</p>
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
              <h1 className="text-2xl font-bold text-white">Monga Awards - Admin</h1>
              <p className="text-slate-400">Painel Administrativo</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button onClick={() => router.push("/admin/codes")} className="btn-secondary">
              <Key className="h-4 w-4 mr-2" />
              Códigos
            </Button>
            <Button onClick={() => router.push("/resultados")} className="btn-secondary">
              <TrendingUp className="h-4 w-4 mr-2" />
              Resultados
            </Button>
            <Button onClick={() => router.push("/dashboard")} className="btn-secondary">
              Ver como Usuário
            </Button>
            <Button onClick={handleLogout} className="btn-secondary">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
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
              <div className="text-2xl font-bold text-white">{categories.length}</div>
              <div className="text-sm text-slate-400">Categorias</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <Users className="h-8 w-8 text-green-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{nominees.length}</div>
              <div className="text-sm text-slate-400">Indicados</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <BarChart3 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">{getTotalVotes()}</div>
              <div className="text-sm text-slate-400">Total de Votos</div>
            </CardContent>
          </Card>
          <Card className="dark-card">
            <CardContent className="p-4 text-center">
              <Star className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <div className="text-2xl font-bold text-white">
                {categories.filter((c) => c.phase_1_active || c.phase_2_active).length}
              </div>
              <div className="text-sm text-slate-400">Votações Ativas</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3 dark-tabs">
            <TabsTrigger value="categories" className="dark-tab">
              Categorias
            </TabsTrigger>
            <TabsTrigger value="nominees" className="dark-tab">
              Indicados
            </TabsTrigger>
            <TabsTrigger value="associations" className="dark-tab">
              Associações
            </TabsTrigger>
          </TabsList>

          <TabsContent value="categories" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gerenciar Categorias</h2>
              <Button onClick={() => openCategoryDialog()} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Nova Categoria
              </Button>
            </div>

            <div className="grid gap-4">
              {categories.map((category) => {
                const categoryNominees = getCategoryNominees(category.id)
                const getPhaseStatus = () => {
                  if (category.is_finalized) return { text: "Finalizada", color: "bg-gray-500/20 text-gray-400" }
                  if (category.phase_2_active) return { text: "Fase 2 Ativa", color: "bg-green-500/20 text-green-400" }
                  if (category.phase_1_active) return { text: "Fase 1 Ativa", color: "bg-blue-500/20 text-blue-400" }
                  return { text: "Aguardando", color: "bg-yellow-500/20 text-yellow-400" }
                }
                const phaseStatus = getPhaseStatus()

                return (
                  <Card key={category.id} className="dark-card hover-lift">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="flex items-center gap-2 flex-wrap text-white">
                            {category.name}
                            <Badge className={category.is_active ? "status-open" : "bg-gray-500/20 text-gray-400"}>
                              {category.is_active ? "Ativa" : "Inativa"}
                            </Badge>
                            <Badge className={phaseStatus.color}>{phaseStatus.text}</Badge>
                          </CardTitle>
                          {category.description && (
                            <CardDescription className="text-slate-400">{category.description}</CardDescription>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 flex-wrap">
                          {!category.phase_1_active && !category.phase_2_active && !category.is_finalized && (
                            <Button onClick={() => startPhase1(category.id)} size="sm" className="btn-primary">
                              Iniciar Fase 1
                            </Button>
                          )}

                          {category.phase_1_active && (
                            <>
                              <Button onClick={() => finishPhase1(category.id)} size="sm" className="btn-secondary">
                                Finalizar Fase 1
                              </Button>
                              <Button onClick={() => loadPhase1Results(category)} size="sm" className="btn-secondary">
                                Ver Resultados
                              </Button>
                            </>
                          )}

                          {!category.phase_1_active &&
                            !category.phase_2_active &&
                            !category.is_finalized &&
                            categoryNominees.length > 0 && (
                              <Button onClick={() => startPhase2(category.id)} size="sm" className="btn-primary">
                                Iniciar Fase 2
                              </Button>
                            )}

                          {category.phase_2_active && (
                            <Button onClick={() => finishPhase2(category.id)} size="sm" className="btn-secondary">
                              Finalizar Votação
                            </Button>
                          )}

                          <Button onClick={() => openCategoryDialog(category)} size="sm" className="btn-secondary">
                            <Edit className="h-4 w-4" />
                          </Button>

                          <Button
                            onClick={() => handleDeleteCategory(category.id)}
                            size="sm"
                            className="btn-secondary text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {category.banner_image && (
                        <div className="mb-4">
                          <Image
                            src={category.banner_image || "/placeholder.svg"}
                            alt={category.name}
                            width={400}
                            height={100}
                            className="w-full h-20 object-cover rounded"
                          />
                        </div>
                      )}
                      <div className="text-sm text-slate-400">
                        {category.phase_2_active || category.is_finalized
                          ? `${categoryNominees.length} finalistas`
                          : `${nominees.length} indicados disponíveis para Fase 1`}
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="nominees" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Gerenciar Indicados</h2>
              <Button onClick={() => openNomineeDialog()} className="btn-primary">
                <Plus className="h-4 w-4 mr-2" />
                Novo Indicado
              </Button>
            </div>

            <div className="grid gap-4">
              {nominees.map((nominee) => {
                const associatedCategories = getNomineeCategories(nominee.id)
                return (
                  <Card key={nominee.id} className="dark-card hover-lift">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {nominee.image && (
                            <Image
                              src={nominee.image || "/placeholder.svg"}
                              alt={nominee.name}
                              width={80}
                              height={80}
                              className="w-20 h-20 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-white flex items-center gap-2 mb-2">
                              {nominee.name}
                              <Badge className={nominee.is_active ? "status-open" : "bg-gray-500/20 text-gray-400"}>
                                {nominee.is_active ? "Ativo" : "Inativo"}
                              </Badge>
                            </h3>
                            {nominee.description && (
                              <p className="text-sm text-slate-400 mb-2">{nominee.description}</p>
                            )}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {associatedCategories.map((category) => (
                                <Badge
                                  key={category.id}
                                  className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
                                >
                                  {category.name} (Finalista)
                                </Badge>
                              ))}
                            </div>
                            <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                              {nominee.vote_count} votos (legacy)
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button onClick={() => openAssociationDialog(nominee)} size="sm" className="btn-secondary">
                            <Link2 className="h-4 w-4" />
                          </Button>
                          <Button onClick={() => openNomineeDialog(nominee)} size="sm" className="btn-secondary">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteNominee(nominee.id)}
                            size="sm"
                            className="btn-secondary text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>

          <TabsContent value="associations" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-white">Finalistas por Categoria</h2>
              <p className="text-slate-400">Gerencie os finalistas da Fase 2</p>
            </div>

            <div className="grid gap-4">
              {nominees.map((nominee) => {
                const associatedCategories = getNomineeCategories(nominee.id)
                return (
                  <Card key={nominee.id} className="dark-card hover-lift">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4 flex-1">
                          {nominee.image && (
                            <Image
                              src={nominee.image || "/placeholder.svg"}
                              alt={nominee.name}
                              width={60}
                              height={60}
                              className="w-15 h-15 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-white mb-2">{nominee.name}</h3>
                            <div className="flex flex-wrap gap-1">
                              {associatedCategories.length > 0 ? (
                                associatedCategories.map((category) => (
                                  <Badge
                                    key={category.id}
                                    className="bg-blue-500/20 text-blue-400 border-blue-500/30 text-xs"
                                  >
                                    {category.name}
                                  </Badge>
                                ))
                              ) : (
                                <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30 text-xs">
                                  Não é finalista em nenhuma categoria
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button onClick={() => openAssociationDialog(nominee)} className="btn-primary" size="sm">
                          <Link2 className="h-4 w-4 mr-2" />
                          Gerenciar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialog for Category/Nominee/Association/Phase1Results Forms */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl dark-card border-slate-600 max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {dialogType === "phase1-results" ? "Resultados da Fase 1" : editingId ? "Editar" : "Nova"}{" "}
              {dialogType === "category"
                ? "Categoria"
                : dialogType === "nominee"
                  ? "Indicado"
                  : dialogType === "association"
                    ? "Associação"
                    : ""}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {dialogType === "phase1-results"
                ? "Selecione os finalistas para a Fase 2"
                : dialogType === "category"
                  ? "Preencha os dados da categoria"
                  : dialogType === "nominee"
                    ? "Preencha os dados do indicado"
                    : "Selecione as categorias para associar ao indicado"}
            </DialogDescription>
          </DialogHeader>

          {dialogType === "phase1-results" ? (
            <Phase1ResultsDialog
              results={phaseResults}
              category={selectedCategoryForResults}
              onSelectFinalists={selectFinalists}
              onClose={() => setIsDialogOpen(false)}
            />
          ) : dialogType === "category" ? (
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <Label htmlFor="category-name" className="text-slate-300">
                  Nome
                </Label>
                <Input
                  id="category-name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  required
                  className="dark-input"
                />
              </div>
              <div>
                <Label htmlFor="category-description" className="text-slate-300">
                  Descrição
                </Label>
                <Textarea
                  id="category-description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="dark-input"
                />
              </div>

              {/* Image Upload Component */}
              <ImageUpload
                currentImageUrl={categoryForm.banner_image}
                onImageChange={(url) => setCategoryForm({ ...categoryForm, banner_image: url || "" })}
                folder="categories"
                label="Banner da Categoria"
                aspectRatio="banner"
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="category-active"
                  checked={categoryForm.is_active}
                  onCheckedChange={(checked) => setCategoryForm({ ...categoryForm, is_active: checked })}
                />
                <Label htmlFor="category-active" className="text-slate-300">
                  Categoria ativa
                </Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" onClick={() => setIsDialogOpen(false)} className="btn-secondary">
                  Cancelar
                </Button>
                <Button type="submit" className="btn-primary">
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          ) : dialogType === "nominee" ? (
            <form onSubmit={handleNomineeSubmit} className="space-y-4">
              <div>
                <Label htmlFor="nominee-name" className="text-slate-300">
                  Nome
                </Label>
                <Input
                  id="nominee-name"
                  value={nomineeForm.name}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, name: e.target.value })}
                  required
                  className="dark-input"
                />
              </div>
              <div>
                <Label htmlFor="nominee-description" className="text-slate-300">
                  Descrição
                </Label>
                <Textarea
                  id="nominee-description"
                  value={nomineeForm.description}
                  onChange={(e) => setNomineeForm({ ...nomineeForm, description: e.target.value })}
                  className="dark-input"
                />
              </div>

              {/* Image Upload Component */}
              <ImageUpload
                currentImageUrl={nomineeForm.image}
                onImageChange={(url) => setNomineeForm({ ...nomineeForm, image: url || "" })}
                folder="nominees"
                label="Foto do Indicado"
                aspectRatio="square"
              />

              <div className="flex items-center space-x-2">
                <Switch
                  id="nominee-active"
                  checked={nomineeForm.is_active}
                  onCheckedChange={(checked) => setNomineeForm({ ...nomineeForm, is_active: checked })}
                />
                <Label htmlFor="nominee-active" className="text-slate-300">
                  Indicado ativo
                </Label>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" onClick={() => setIsDialogOpen(false)} className="btn-secondary">
                  Cancelar
                </Button>
                <Button type="submit" className="btn-primary">
                  {editingId ? "Atualizar" : "Criar"}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleAssociationSubmit} className="space-y-4">
              <div>
                <Label className="text-slate-300">Indicado</Label>
                <p className="text-sm text-white">{nominees.find((n) => n.id === associationForm.nominee_id)?.name}</p>
              </div>
              <div>
                <Label className="text-slate-300">Categorias (Finalista)</Label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {categories.map((category) => (
                    <div key={category.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`category-${category.id}`}
                        checked={associationForm.category_ids.includes(category.id)}
                        onCheckedChange={(checked) => handleCategoryToggle(category.id, checked as boolean)}
                      />
                      <Label htmlFor={`category-${category.id}`} className="text-sm text-slate-300">
                        {category.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" onClick={() => setIsDialogOpen(false)} className="btn-secondary">
                  Cancelar
                </Button>
                <Button type="submit" className="btn-primary">
                  Salvar Associações
                </Button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// Component for Phase 1 Results Dialog
function Phase1ResultsDialog({
  results,
  category,
  onSelectFinalists,
  onClose,
}: {
  results: Phase1Result[]
  category: Category | null
  onSelectFinalists: (nominees: string[]) => void
  onClose: () => void
}) {
  const [selectedNominees, setSelectedNominees] = useState<string[]>([])

  const handleNomineeToggle = (nomineeId: string) => {
    setSelectedNominees((prev) =>
      prev.includes(nomineeId) ? prev.filter((id) => id !== nomineeId) : [...prev, nomineeId],
    )
  }

  const handleSelectTop4 = () => {
    const top4 = results.slice(0, 4).map((r) => r.nominee_id)
    setSelectedNominees(top4)
  }

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-2">Resultados da Fase 1 - {category?.name}</h3>
        <p className="text-slate-400">Selecione os finalistas que irão para a Fase 2</p>
      </div>

      <div className="flex justify-between items-center">
        <Button onClick={handleSelectTop4} className="btn-secondary">
          Selecionar Top 4
        </Button>
        <Badge className="bg-blue-500/20 text-blue-400">{selectedNominees.length} selecionados</Badge>
      </div>

      <div className="grid gap-3 max-h-96 overflow-y-auto">
        {results.map((result, index) => (
          <Card key={result.nominee_id} className="dark-card">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-slate-700">
                  {index === 0 && <Crown className="h-5 w-5 text-yellow-400" />}
                  {index === 1 && <Medal className="h-5 w-5 text-gray-400" />}
                  {index === 2 && <Award className="h-5 w-5 text-orange-400" />}
                  {index > 2 && <span className="text-slate-300 font-bold">#{index + 1}</span>}
                </div>

                {result.nominee_image && (
                  <Image
                    src={result.nominee_image || "/placeholder.svg"}
                    alt={result.nominee_name}
                    width={60}
                    height={60}
                    className="w-15 h-15 object-cover rounded"
                  />
                )}

                <div className="flex-1">
                  <h4 className="font-semibold text-white">{result.nominee_name}</h4>
                  <Badge className="bg-purple-500/20 text-purple-400">{result.vote_count} indicações</Badge>
                </div>

                <Checkbox
                  checked={selectedNominees.includes(result.nominee_id)}
                  onCheckedChange={() => handleNomineeToggle(result.nominee_id)}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex justify-end space-x-2">
        <Button onClick={onClose} className="btn-secondary">
          Cancelar
        </Button>
        <Button
          onClick={() => onSelectFinalists(selectedNominees)}
          disabled={selectedNominees.length === 0}
          className="btn-primary"
        >
          Selecionar {selectedNominees.length} Finalistas
        </Button>
      </div>
    </div>
  )
}
