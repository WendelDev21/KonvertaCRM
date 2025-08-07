"use client"

import type React from "react"

import { useState, useEffect, useCallback } from "react"
import { useSession } from "next-auth/react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import { Separator } from "@/components/ui/separator"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { toast } from "sonner"
import { Send, Users, Clock, CheckCircle, XCircle, AlertCircle, Play, Pause, RotateCcw, ArrowLeft, Trash2, Crown, Zap, Star, Save, FileText, Copy, RefreshCw, Plus, Search, Grid, List, MoreHorizontal, File, X, Download, ImageIcon, Edit, Calendar, DollarSign, Wallet } from 'lucide-react'
import Link from "next/link"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

interface Contact {
  id: string
  name: string
  contact: string
  status: string
  source: string
}

interface WhatsAppInstance {
  id: string
  instanceName: string
  status: string
}

interface Campaign {
  id: string
  name: string
  message: string
  status: string
  totalContacts: number
  sentCount: number
  failedCount: number
  createdAt: string
  scheduledAt?: string
  completedAt?: string
  mediaUrl?: string
  mediaType?: string
  fileName?: string
  caption?: string
}

interface MessageTemplate {
  id: string
  name: string
  message: string
  category: string
  usageCount: number
  createdAt: string
  mediaUrl?: string
  mediaType?: string
  fileName?: string
  caption?: string
}

interface DailyLimit {
  sentCount: number
  limit: number
  date: string
}

interface UploadedFile {
  url: string
  fileName: string
  mediaType: string
  size: number
  mimeType: string
}

const MESSAGE_COST = 0.09; // R$0,09 per message

export default function CampaignsPage() {
  const { data: session, update } = useSession()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [templates, setTemplates] = useState<MessageTemplate[]>([])
  const [dailyLimit, setDailyLimit] = useState<DailyLimit>({ sentCount: 0, limit: 100, date: "" })
  const [userCredits, setUserCredits] = useState<number>(0) // New state for user credits
  const [loading, setLoading] = useState(false)
  const [deletingCampaign, setDeletingCampaign] = useState<string | null>(null)
  const [restartingCampaign, setRestartingCampaign] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  // Form states
  const [campaignName, setCampaignName] = useState("")
  const [message, setMessage] = useState("")
  const [selectedInstance, setSelectedInstance] = useState("")
  const [selectedContacts, setSelectedContacts] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<string>("all")
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null)
  const [caption, setCaption] = useState("")
  const [scheduledAt, setScheduledAt] = useState("")
  const [isScheduled, setIsScheduled] = useState(false)

  // Template states
  const [templateName, setTemplateName] = useState("")
  const [templateCategory, setTemplateCategory] = useState("Geral")
  const [selectedTemplate, setSelectedTemplate] = useState<string>("")
  const [templateSearch, setTemplateSearch] = useState("")
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [showUseTemplateDialog, setShowUseTemplateDialog] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<MessageTemplate | null>(null)
  const [templateToUse, setTemplateToUse] = useState<MessageTemplate | null>(null)

  // Edit campaign states
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editCampaignName, setEditCampaignName] = useState("")
  const [editMessage, setEditMessage] = useState("")
  const [editCaption, setEditCaption] = useState("")
  const [editScheduledAt, setEditScheduledAt] = useState("")
  const [editIsScheduled, setEditIsScheduled] = useState(false)
  const [editSelectedContacts, setEditSelectedContacts] = useState<string[]>([])
  const [editUploadedFile, setEditUploadedFile] = useState<UploadedFile | null>(null)

  // View states
  const [campaignView, setCampaignView] = useState<"grid" | "list">("grid")

  // Verificar se o usuário tem plano Business
  const userPlan = session?.user ? (session.user as any).plan || "Starter" : "Starter"
  const hasBusinessAccess = userPlan === "Business"

  // Load data
  useEffect(() => {
    // Only load data if the user session is available and the user ID is stable
    if (session?.user?.id) {
      loadContacts()
      loadInstances()
      loadCampaigns()
      loadTemplates()
      loadDailyLimit()
      loadUserCredits() // Load user credits
    }
  }, [session?.user?.id]) // Depend on session.user.id to prevent unnecessary re-fetches

  const loadContacts = async () => {
    try {
      const response = await fetch("/api/contacts")
      if (response.ok) {
        const data = await response.json()
        setContacts(data)
      }
    } catch (error) {
      console.error("Error loading contacts:", error)
    }
  }

  const loadInstances = async () => {
    try {
      const response = await fetch("/api/connections/instances")
      if (response.ok) {
        const data = await response.json()
        setInstances(data.filter((instance: WhatsAppInstance) => instance.status === "CONNECTED"))
      }
    } catch (error) {
      console.error("Error loading instances:", error)
    }
  }

  const loadCampaigns = async () => {
    try {
      const response = await fetch("/api/campaigns")
      if (response.ok) {
        const data = await response.json()
        setCampaigns(data)
      }
    } catch (error) {
      console.error("Error loading campaigns:", error)
    }
  }

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/templates")
      if (response.ok) {
        const data = await response.json()
        setTemplates(data)
      }
    } catch (error) {
      console.error("Error loading templates:", error)
    }
  }

  const loadDailyLimit = async () => {
    try {
      const response = await fetch("/api/campaigns/daily-limit")
      if (response.ok) {
        const data = await response.json()
        setDailyLimit(data)
      }
    } catch (error) {
      console.error("Error loading daily limit:", error)
    }
  }

  const loadUserCredits = async () => {
    try {
      const response = await fetch("/api/users/me")
      if (response.ok) {
        const data = await response.json()
        // Ensure data.credits is a number, default to 0 if null/undefined
        const credits = typeof data.credits === 'number' ? data.credits : 0;
        setUserCredits(credits)
        // Only update session if the credits value has actually changed to avoid infinite loops
        if (session?.user && (session.user as any).credits !== credits) {
          update({ credits: credits });
        }
      }
    } catch (error) {
      console.error("Error loading user credits:", error)
      setUserCredits(0); // Default to 0 on error
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Verificar tamanho do arquivo (100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Tamanho máximo permitido: 3MB`)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const uploadResult = await response.json()
        setUploadedFile(uploadResult)
        toast.success("Arquivo enviado com sucesso! Será convertido para base64 no envio.")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao enviar arquivo")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Erro ao enviar arquivo")
    } finally {
      setUploading(false)
    }
  }

  const handleEditFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Verificar tamanho do arquivo (100MB)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      toast.error(`Arquivo muito grande. Tamanho máximo permitido: 3MB`)
      return
    }

    setUploading(true)

    try {
      const formData = new FormData()
      formData.append("file", file)

      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      })

      if (response.ok) {
        const uploadResult = await response.json()
        setEditUploadedFile(uploadResult)
        toast.success("Arquivo enviado com sucesso!")
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao enviar arquivo")
      }
    } catch (error) {
      console.error("Error uploading file:", error)
      toast.error("Erro ao enviar arquivo")
    } finally {
      setUploading(false)
    }
  }

  const removeUploadedFile = () => {
    setUploadedFile(null)
    setCaption("")
  }

  const removeEditUploadedFile = () => {
    setEditUploadedFile(null)
    setEditCaption("")
  }

  const filteredContacts = contacts.filter((contact) => filterStatus === "all" || contact.status === filterStatus)

  const filteredTemplates = templates.filter(
    (template) =>
      template.name.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.message.toLowerCase().includes(templateSearch.toLowerCase()) ||
      template.category.toLowerCase().includes(templateSearch.toLowerCase()),
  )

  const handleContactSelection = (contactId: string, checked: boolean) => {
    const currentSelectedCount = selectedContacts.length;
    const estimatedCost = (currentSelectedCount + (checked ? 1 : -1)) * MESSAGE_COST;

    if (checked) {
      if (currentSelectedCount + 1 > dailyLimit.limit - dailyLimit.sentCount) {
        toast.error(
          `Limite diário excedido. Você pode enviar apenas ${dailyLimit.limit - dailyLimit.sentCount} mensagens hoje.`,
        )
        return
      }
      if (userCredits < estimatedCost) {
        toast.error(`Créditos insuficientes. Você precisa de R$${estimatedCost.toFixed(2)} para enviar esta mensagem. Saldo atual: R$${userCredits.toFixed(2)}.`)
        return;
      }
      setSelectedContacts([...selectedContacts, contactId])
    } else {
      setSelectedContacts(selectedContacts.filter((id) => id !== contactId))
    }
  }

  const handleEditContactSelection = (contactId: string, checked: boolean) => {
    const currentSelectedCount = editSelectedContacts.length;
    const estimatedCost = (currentSelectedCount + (checked ? 1 : -1)) * MESSAGE_COST;

    if (checked) {
      if (currentSelectedCount + 1 > dailyLimit.limit - dailyLimit.sentCount) {
        toast.error(
          `Limite diário excedido. Você pode enviar apenas ${dailyLimit.limit - dailyLimit.sentCount} mensagens hoje.`,
        )
        return
      }
      if (userCredits < estimatedCost) {
        toast.error(`Créditos insuficientes. Você precisa de R$${estimatedCost.toFixed(2)} para enviar esta mensagem. Saldo atual: R$${userCredits.toFixed(2)}.`)
        return;
      }
      setEditSelectedContacts([...editSelectedContacts, contactId])
    } else {
      setEditSelectedContacts(editSelectedContacts.filter((id) => id !== contactId))
    }
  }

  const handleSelectAllByStatus = (status: string) => {
    const statusContacts = contacts.filter((contact) => contact.status === status)
    const availableSlots = dailyLimit.limit - dailyLimit.sentCount
    const contactsToAdd = statusContacts.slice(0, availableSlots)

    const currentSelectedCount = selectedContacts.length;
    const newTotalContacts = currentSelectedCount + contactsToAdd.length;
    const estimatedCost = newTotalContacts * MESSAGE_COST;

    if (userCredits < estimatedCost) {
      toast.error(`Créditos insuficientes para selecionar todos os contatos. Você precisa de R$${estimatedCost.toFixed(2)} para esta seleção. Saldo atual: R$${userCredits.toFixed(2)}.`)
      return;
    }

    if (statusContacts.length > availableSlots) {
      toast.warning(`Apenas ${availableSlots} contatos foram selecionados devido ao limite diário.`)
    }

    const newSelected = [...selectedContacts, ...contactsToAdd.map((c) => c.id)]
    setSelectedContacts([...new Set(newSelected)])
  }

  const handleEditSelectAllByStatus = (status: string) => {
    const statusContacts = contacts.filter((contact) => contact.status === status)
    const availableSlots = dailyLimit.limit - dailyLimit.sentCount
    const contactsToAdd = statusContacts.slice(0, availableSlots)

    const currentSelectedCount = editSelectedContacts.length;
    const newTotalContacts = currentSelectedCount + contactsToAdd.length;
    const estimatedCost = newTotalContacts * MESSAGE_COST;

    if (userCredits < estimatedCost) {
      toast.error(`Créditos insuficientes para selecionar todos os contatos. Você precisa de R$${estimatedCost.toFixed(2)} para esta seleção. Saldo atual: R$${userCredits.toFixed(2)}.`)
      return;
    }

    if (statusContacts.length > availableSlots) {
      toast.warning(`Apenas ${availableSlots} contatos foram selecionados devido ao limite diário.`)
    }

    const newSelected = [...editSelectedContacts, ...contactsToAdd.map((c) => c.id)]
    setEditSelectedContacts([...new Set(newSelected)])
  }

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      toast.error("Nome do template é obrigatório")
      return
    }

    if (!message.trim() && !uploadedFile) {
      toast.error("Mensagem ou mídia é obrigatória")
      return
    }

    try {
      const url = editingTemplate ? `/api/templates/${editingTemplate.id}` : "/api/templates"
      const method = editingTemplate ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateName,
          message,
          category: templateCategory,
          mediaUrl: uploadedFile?.url,
          mediaType: uploadedFile?.mediaType,
          fileName: uploadedFile?.fileName,
          caption: caption || message,
        }),
      })

      if (response.ok) {
        toast.success(editingTemplate ? "Template atualizado com sucesso!" : "Template salvo com sucesso!")
        setTemplateName("")
        setTemplateCategory("Geral")
        setUploadedFile(null)
        setCaption("")
        setShowTemplateDialog(false)
        setEditingTemplate(null)
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao salvar template")
      }
    } catch (error) {
      console.error("Error saving template:", error)
      toast.error("Erro ao salvar template")
    }
  }

  const useTemplate = async (template: MessageTemplate) => {
    setMessage(template.message)
    setCampaignName(template.name)
    setCaption(template.caption || "")

    if (template.mediaUrl) {
      setUploadedFile({
        url: template.mediaUrl,
        fileName: template.fileName || "media",
        mediaType: template.mediaType || "image",
        size: 0,
        mimeType: "",
      })
    }

    // Incrementar contador de uso
    try {
      await fetch(`/api/templates/${template.id}`, {
        method: "POST",
      })
      loadTemplates() // Recarregar para atualizar contador
    } catch (error) {
      console.error("Error updating template usage:", error)
    }

    toast.success(`Template "${template.name}" aplicado!`)
  }

  const useTemplateWithContacts = async (template: MessageTemplate) => {
    setTemplateToUse(template)
    setShowUseTemplateDialog(true)
  }

  const createCampaignFromTemplate = async () => {
    if (!templateToUse) return

    if (!selectedInstance) {
      toast.error("Selecione uma instância do WhatsApp")
      return
    }

    if (selectedContacts.length === 0) {
      toast.error("Selecione pelo menos um contato")
      return
    }

    const estimatedCost = selectedContacts.length * MESSAGE_COST;
    if (userCredits < estimatedCost) {
      toast.error(`Créditos insuficientes. Você precisa de R$${estimatedCost.toFixed(2)} para esta campanha. Saldo atual: R$${userCredits.toFixed(2)}.`)
      return;
    }

    if (selectedContacts.length > dailyLimit.limit - dailyLimit.sentCount) {
      toast.error(
        `Limite diário excedido. Você pode enviar apenas ${dailyLimit.limit - dailyLimit.sentCount} mensagens hoje.`,
      )
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: templateToUse.name,
          message: templateToUse.message,
          instanceId: selectedInstance,
          contactIds: selectedContacts,
          mediaUrl: templateToUse.mediaUrl,
          mediaType: templateToUse.mediaType,
          fileName: templateToUse.fileName,
          caption: templateToUse.caption,
        }),
      })

      if (response.ok) {
        // Incrementar contador de uso do template
        await fetch(`/api/templates/${templateToUse.id}`, {
          method: "POST",
        })

        toast.success("Campanha criada com sucesso! O envio será iniciado em breve.")

        // Reset form
        setSelectedContacts([])
        setTemplateToUse(null)
        setShowUseTemplateDialog(false)

        // Reload data
        loadCampaigns()
        loadTemplates()
        loadDailyLimit()
        loadUserCredits() // Reload credits after campaign creation
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao criar campanha")
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Erro ao criar campanha")
    } finally {
      setLoading(false)
    }
  }

  const deleteTemplate = async (templateId: string) => {
    try {
      const response = await fetch(`/api/templates/${templateId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Template deletado com sucesso!")
        loadTemplates()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao deletar template")
      }
    } catch (error) {
      console.error("Error deleting template:", error)
      toast.error("Erro ao deletar template")
    }
  }

  const createCampaign = async () => {
    if (!campaignName.trim()) {
      toast.error("Nome da campanha é obrigatório")
      return
    }

    if (!message.trim() && !uploadedFile) {
      toast.error("Mensagem ou mídia é obrigatória")
      return
    }

    if (!selectedInstance) {
      toast.error("Selecione uma instância do WhatsApp")
      return
    }

    if (selectedContacts.length === 0) {
      toast.error("Selecione pelo menos um contato")
      return
    }

    const estimatedCost = selectedContacts.length * MESSAGE_COST;
    if (userCredits < estimatedCost) {
      toast.error(`Créditos insuficientes. Você precisa de R$${estimatedCost.toFixed(2)} para esta campanha. Saldo atual: R$${userCredits.toFixed(2)}.`)
      return;
    }

    if (selectedContacts.length > dailyLimit.limit - dailyLimit.sentCount) {
      toast.error(
        `Limite diário excedido. Você pode enviar apenas ${dailyLimit.limit - dailyLimit.sentCount} mensagens hoje.`,
      )
      return
    }

    if (isScheduled && !scheduledAt) {
      toast.error("Data e hora de agendamento são obrigatórias")
      return
    }

    if (isScheduled && new Date(scheduledAt) <= new Date()) {
      toast.error("Data de agendamento deve ser no futuro")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: campaignName,
          message,
          instanceId: selectedInstance,
          contactIds: selectedContacts,
          mediaUrl: uploadedFile?.url,
          mediaType: uploadedFile?.mediaType,
          fileName: uploadedFile?.fileName,
          caption: caption || message,
          scheduledAt: isScheduled ? scheduledAt : null,
        }),
      })

      if (response.ok) {
        const campaign = await response.json()
        toast.success(
          isScheduled 
            ? "Campanha agendada com sucesso!" 
            : "Campanha criada com sucesso! O envio será iniciado em breve."
        )

        // Reset form
        setCampaignName("")
        setMessage("")
        setSelectedContacts([])
        setUploadedFile(null)
        setCaption("")
        setScheduledAt("")
        setIsScheduled(false)

        // Reload data
        loadCampaigns()
        loadDailyLimit()
        loadUserCredits() // Reload credits after campaign creation
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao criar campanha")
      }
    } catch (error) {
      console.error("Error creating campaign:", error)
      toast.error("Erro ao criar campanha")
    } finally {
      setLoading(false)
    }
  }

  const editCampaign = async (campaign: Campaign) => {
    setEditingCampaign(campaign)
    setEditCampaignName(campaign.name)
    setEditMessage(campaign.message)
    setEditCaption(campaign.caption || "")
    setEditScheduledAt(campaign.scheduledAt ? new Date(campaign.scheduledAt).toISOString().slice(0, 16) : "")
    setEditIsScheduled(campaign.status === "SCHEDULED")
    
    if (campaign.mediaUrl) {
      setEditUploadedFile({
        url: campaign.mediaUrl,
        fileName: campaign.fileName || "media",
        mediaType: campaign.mediaType || "image",
        size: 0,
        mimeType: "",
      })
    } else {
      setEditUploadedFile(null)
    }

    // Carregar contatos da campanha
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`)
      if (response.ok) {
        const campaignData = await response.json()
        const contactIds = campaignData.sends.map((send: any) => send.contactId)
        setEditSelectedContacts(contactIds)
      }
    } catch (error) {
      console.error("Error loading campaign contacts:", error)
    }

    setShowEditDialog(true)
  }

  const updateCampaign = async () => {
    if (!editingCampaign) return

    if (!editCampaignName.trim()) {
      toast.error("Nome da campanha é obrigatório")
      return
    }

    if (!editMessage.trim() && !editUploadedFile) {
      toast.error("Mensagem ou mídia é obrigatória")
      return
    }

    if (editIsScheduled && !editScheduledAt) {
      toast.error("Data e hora de agendamento são obrigatórias")
      return
    }

    if (editIsScheduled && new Date(editScheduledAt) <= new Date()) {
      toast.error("Data de agendamento deve ser no futuro")
      return
    }

    const estimatedCost = editSelectedContacts.length * MESSAGE_COST;
    if (userCredits < estimatedCost) {
      toast.error(`Créditos insuficientes. Você precisa de R$${estimatedCost.toFixed(2)} para esta campanha. Saldo atual: R$${userCredits.toFixed(2)}.`)
      return;
    }

    setLoading(true)

    try {
      const response = await fetch(`/api/campaigns/${editingCampaign.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: editCampaignName,
          message: editMessage,
          contactIds: editSelectedContacts,
          mediaUrl: editUploadedFile?.url,
          mediaType: editUploadedFile?.mediaType,
          fileName: editUploadedFile?.fileName,
          caption: editCaption || editMessage,
          scheduledAt: editIsScheduled ? editScheduledAt : null,
        }),
      })

      if (response.ok) {
        toast.success("Campanha atualizada com sucesso!")
        setShowEditDialog(false)
        setEditingCampaign(null)
        loadCampaigns()
        loadUserCredits(); // Reload credits after campaign update
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao atualizar campanha")
      }
    } catch (error) {
      console.error("Error updating campaign:", error)
      toast.error("Erro ao atualizar campanha")
    } finally {
      setLoading(false)
    }
  }

  const pauseCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/pause`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Campanha pausada")
        loadCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao pausar campanha")
      }
    } catch (error) {
      console.error("Error pausing campaign:", error)
      toast.error("Erro ao pausar campanha")
    }
  }

  const resumeCampaign = async (campaignId: string) => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/resume`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Campanha retomada")
        loadCampaigns()
      } else {
        const error = await response.json()
        toast.error(error.message || "Erro ao retomar campanha")
      }
    } catch (error) {
      console.error("Error resuming campaign:", error)
      toast.error("Erro ao retomar campanha")
    }
  }

  const restartCampaign = async (campaignId: string) => {
    setRestartingCampaign(campaignId)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}/restart`, {
        method: "POST",
      })

      if (response.ok) {
        toast.success("Campanha reiniciada com sucesso!")
        loadCampaigns()
        loadDailyLimit()
        loadUserCredits(); // Reload credits after campaign restart
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao reiniciar campanha")
      }
    } catch (error) {
      console.error("Error restarting campaign:", error)
      toast.error("Erro ao reiniciar campanha")
    } finally {
      setRestartingCampaign(null)
    }
  }

  const deleteCampaign = async (campaignId: string) => {
    setDeletingCampaign(campaignId)

    try {
      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast.success("Campanha deletada com sucesso")
        loadCampaigns()
        loadDailyLimit()
      } else {
        const error = await response.json()
        toast.error(error.error || "Erro ao deletar campanha")
      }
    } catch (error) {
      console.error("Error deleting campaign:", error)
      toast.error("Erro ao deletar campanha")
    } finally {
      setDeletingCampaign(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      PENDING: { color: "bg-yellow-500", label: "Pendente", icon: Clock },
      SCHEDULED: { color: "bg-purple-500", label: "Agendada", icon: Calendar },
      RUNNING: { color: "bg-blue-500", label: "Executando", icon: Play },
      COMPLETED: { color: "bg-green-500", label: "Concluída", icon: CheckCircle },
      PAUSED: { color: "bg-orange-500", label: "Pausada", icon: Pause },
      FAILED: { color: "bg-red-500", label: "Falhou", icon: XCircle },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.PENDING
    const Icon = config.icon

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    )
  }

  const canDeleteCampaign = (status: string) => {
    return status !== "RUNNING"
  }

  const canEditCampaign = (status: string) => {
    // Permite editar campanhas em qualquer status exceto RUNNING
    return status !== "RUNNING"
  }

  const canRestartCampaign = (status: string) => {
    return status === "COMPLETED" || status === "FAILED"
  }

  const remainingLimit = dailyLimit.limit - dailyLimit.sentCount
  const limitPercentage = (dailyLimit.sentCount / dailyLimit.limit) * 100

  // Componente de upgrade para usuários não Business
  const UpgradeToBusinessPage = () => {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold flex items-center space-x-2">
              <Send className="h-8 w-8 text-primary" />
              <span>Campanhas</span>
            </h1>
            <p className="text-muted-foreground">Dispare campanhas de mensagens em massa para seus contatos</p>
          </div>
          <Button variant="outline" asChild>
            <Link href="/dashboard">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Link>
          </Button>
        </div>

        <div className="max-w-4xl mx-auto">
          <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-primary/10 dark:to-primary/20">
            <CardHeader className="text-center pb-6">
              <div className="mx-auto w-16 h-16 bg-primary/10 dark:bg-primary/20 rounded-full flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <CardTitle className="text-2xl">Funcionalidade Premium</CardTitle>
              <CardDescription className="text-lg">
                As campanhas de mensagens em massa estão disponíveis apenas no plano Business
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4">
                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Send className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Campanhas Ilimitadas</h3>
                    <p className="text-sm text-muted-foreground">
                      Crie e execute campanhas de mensagens em massa sem limites
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Users className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Segmentação Avançada</h3>
                    <p className="text-sm text-muted-foreground">
                      Selecione contatos por status, fonte e outros critérios
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Clock className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Envio Programado</h3>
                    <p className="text-sm text-muted-foreground">Agende suas campanhas para o melhor momento</p>
                  </div>
                </div>

                <div className="flex items-center space-x-3 p-4 bg-muted/50 rounded-lg">
                  <div className="flex-shrink-0">
                    <Zap className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Controle Total</h3>
                    <p className="text-sm text-muted-foreground">
                      Pause, retome e monitore suas campanhas em tempo real
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <Star className="h-4 w-4" />
                <AlertDescription>
                  <strong>Plano Business:</strong> Tenha acesso a todas as funcionalidades avançadas de marketing e
                  automação.
                </AlertDescription>
              </Alert>

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button asChild className="flex-1">
                  <Link href="/settings/upgrades">
                    <Crown className="mr-2 h-4 w-4" />
                    Fazer Upgrade para Business
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/dashboard">Voltar ao Dashboard</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!hasBusinessAccess) {
    return <UpgradeToBusinessPage />
  }

  const TemplateActions = ({ template }: { template: MessageTemplate }) => {
    const handleUseTemplate = useCallback(() => useTemplate(template), [template])
    const handleUseTemplateWithContacts = useCallback(() => useTemplateWithContacts(template), [template])

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={handleUseTemplate}>
            <Copy className="h-4 w-4 mr-2" />
            Usar na Criação
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleUseTemplateWithContacts}>
            <Send className="h-4 w-4 mr-2" />
            Usar com Contatos
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => deleteTemplate(template.id)} className="text-red-600">
            <Trash2 className="h-4 w-4 mr-2" />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center space-x-2">
            <Send className="h-8 w-8 text-primary" />
            <span>Campanhas</span>
          </h1>
          <p className="text-muted-foreground">Dispare campanhas de mensagens em massa para seus contatos</p>
        </div>
      </div>

      {/* Daily Limit and Credits Alert */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Alert className="border-l-4 border-l-primary">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  Limite diário de envios: {dailyLimit.sentCount}/{dailyLimit.limit}
                </span>
                <span className="text-sm text-muted-foreground">Restam {remainingLimit} envios hoje</span>
              </div>
              <Progress value={limitPercentage} className="w-full h-2" />
            </div>
          </AlertDescription>
        </Alert>
        <Alert className="border-l-4 border-l-green-500">
          <DollarSign className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="flex items-center justify-between">
              <span className="font-medium">
                Seu Saldo de Créditos: <span className="text-green-600 font-bold">R$ {userCredits.toFixed(2)}</span>
              </span>
              <Button variant="link" size="sm" asChild>
                <Link href="/credits">
                  <Plus className="h-4 w-4 mr-1" />
                  Recarregar
                </Link>
              </Button>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Cada mensagem custa R$0,09.
            </p>
          </AlertDescription>
        </Alert>
      </div>

      <Tabs defaultValue="create" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="create" className="flex items-center space-x-2">
            <Plus className="w-4 h-4" />
            <span>Criar</span>
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Templates</span>
          </TabsTrigger>
          <TabsTrigger value="campaigns" className="flex items-center space-x-2">
            <Send className="w-4 h-4" />
            <span>Campanhas</span>
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center space-x-2">
            <Zap className="w-4 h-4" />
            <span>Analytics</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Campaign Form */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="w-5 h-5" />
                    <span>Nova Campanha</span>
                  </CardTitle>
                  <CardDescription>Configure sua campanha de mensagens em massa</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="campaignName">Nome da Campanha</Label>
                      <Input
                        id="campaignName"
                        placeholder="Ex: Promoção Black Friday"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instance">Instância WhatsApp</Label>
                      <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma instância" />
                        </SelectTrigger>
                        <SelectContent>
                          {instances.map((instance) => (
                            <SelectItem key={instance.id} value={instance.id}>
                              {instance.instanceName} - {instance.status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {instances.length === 0 && (
                        <p className="text-sm text-red-500">Nenhuma instância conectada encontrada</p>
                      )}
                    </div>
                  </div>

                  {/* Scheduling Section */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="schedule"
                        checked={isScheduled}
                        onCheckedChange={(checked) => setIsScheduled(checked as boolean)}
                      />
                      <Label htmlFor="schedule" className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4" />
                        <span>Agendar campanha</span>
                      </Label>
                    </div>

                    {isScheduled && (
                      <div className="space-y-2">
                        <Label htmlFor="scheduledAt">Data e Hora do Envio</Label>
                        <Input
                          id="scheduledAt"
                          type="datetime-local"
                          value={scheduledAt}
                          onChange={(e) => setScheduledAt(e.target.value)}
                          min={new Date().toISOString().slice(0, 16)}
                        />
                        <p className="text-sm text-muted-foreground">
                          A campanha será executada automaticamente na data e hora especificadas
                        </p>
                      </div>
                    )}
                  </div>

                  {/* File Upload Section */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Mídia (Opcional)</Label>
                      <Badge variant="outline" className="text-xs">
                        Imagens, Documentos - Máx. 3MB
                      </Badge>
                    </div>

                    {!uploadedFile ? (
                      <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                        <div className="text-center space-y-2">
                          <div className="flex justify-center space-x-2">
                            <ImageIcon className="h-8 w-8 text-muted-foreground" />
                            <File className="h-8 w-8 text-muted-foreground" />
                          </div>
                          <div>
                            <Label htmlFor="file-upload" className="cursor-pointer">
                              <div className="text-sm text-muted-foreground">
                                <span className="font-medium text-primary hover:text-primary/80">
                                  Clique para enviar
                                </span>{" "}
                                ou arraste e solte
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                JPG, PNG, GIF, PDF, DOC, XLS, etc. (Máx. 3MB)
                              </div>
                            </Label>
                            <Input
                              id="file-upload"
                              type="file"
                              className="hidden"
                              accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                              onChange={handleFileUpload}
                              disabled={uploading}
                            />
                          </div>
                          {uploading && (
                            <div className="flex items-center justify-center space-x-2">
                              <RotateCcw className="h-4 w-4 animate-spin" />
                              <span className="text-sm">Enviando...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="border rounded-lg p-4 bg-muted/50">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            {uploadedFile.mediaType === "image" ? (
                              <ImageIcon className="h-8 w-8 text-blue-500" />
                            ) : (
                              <File className="h-8 w-8 text-green-500" />
                            )}
                            <div>
                              <p className="font-medium text-sm">{uploadedFile.fileName}</p>
                              <p className="text-xs text-muted-foreground">
                                {uploadedFile.mediaType} • {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => window.open(uploadedFile.url, "_blank")}>
                              <Download className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={removeUploadedFile}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {uploadedFile && (
                      <div className="space-y-2">
                        <Label htmlFor="caption">Legenda da Mídia</Label>
                        <Textarea
                          id="caption"
                          placeholder="Digite uma legenda para a mídia..."
                          rows={3}
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          className="resize-none"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="message">Mensagem {uploadedFile ? "(Opcional)" : ""}</Label>
                      <div className="flex space-x-2">
                        <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm" disabled={!message.trim() && !uploadedFile}>
                              <Save className="w-4 h-4 mr-1" />
                              Salvar Template
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Salvar como Template</DialogTitle>
                              <DialogDescription>
                                Salve esta mensagem como template para reutilização futura
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-2">
                                <Label htmlFor="templateName">Nome do Template</Label>
                                <Input
                                  id="templateName"
                                  placeholder="Ex: Promoção Padrão"
                                  value={templateName}
                                  onChange={(e) => setTemplateName(e.target.value)}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="templateCategory">Categoria</Label>
                                <Select value={templateCategory} onValueChange={setTemplateCategory}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="Geral">Geral</SelectItem>
                                    <SelectItem value="Promoção">Promoção</SelectItem>
                                    <SelectItem value="Cobrança">Cobrança</SelectItem>
                                    <SelectItem value="Suporte">Suporte</SelectItem>
                                    <SelectItem value="Marketing">Marketing</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                                Cancelar
                              </Button>
                              <Button onClick={saveTemplate}>
                                <Save className="w-4 h-4 mr-1" />
                                Salvar Template
                              </Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                    <Textarea
                      id="message"
                      placeholder={uploadedFile ? "Mensagem opcional..." : "Digite sua mensagem aqui..."}
                      rows={6}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      className="resize-none"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{message.length} caracteres</span>
                      {message.length > 0 && (
                        <span>
                          ≈ {Math.ceil(message.length / 160)} SMS{message.length > 160 ? "s" : ""}
                        </span>
                      )}
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Contatos Selecionados</Label>
                      <Badge variant="outline" className="bg-primary/10">
                        {selectedContacts.length} selecionados
                      </Badge>
                    </div>

                    {selectedContacts.length > 0 && (
                      <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <AlertDescription className="text-blue-800 dark:text-blue-200">
                          <strong>Cronograma de envio:</strong> Os envios serão divididos em lotes de 50 mensagens com
                          intervalo de 30 minutos entre cada lote. Tempo estimado:{" "}
                          <strong>{Math.ceil(selectedContacts.length / 50) * 0.5} horas</strong>
                          <br />
                          <strong>Custo estimado:</strong> R${(selectedContacts.length * MESSAGE_COST).toFixed(2)}
                          <br />
                          {isScheduled && (
                            <>
                              <br />
                              <strong>Agendamento:</strong> Campanha iniciará em {new Date(scheduledAt).toLocaleString()}
                            </>
                          )}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Button
                    onClick={createCampaign}
                    disabled={loading || instances.length === 0 || remainingLimit === 0 || userCredits < (selectedContacts.length * MESSAGE_COST)}
                    className="w-full h-12 text-lg"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <RotateCcw className="w-5 h-5 mr-2 animate-spin" />
                        {isScheduled ? "Agendando Campanha..." : "Criando Campanha..."}
                      </>
                    ) : (
                      <>
                        {isScheduled ? (
                          <>
                            <Calendar className="w-5 h-5 mr-2" />
                            Agendar Campanha
                          </>
                        ) : (
                          <>
                            <Send className="w-5 h-5 mr-2" />
                            Criar e Iniciar Campanha
                          </>
                        )}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Contact Selection */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Selecionar Contatos</span>
                  </CardTitle>
                  <CardDescription>Escolha os contatos que receberão a mensagem</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Filtrar por Status</Label>
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="Novo">Novo</SelectItem>
                        <SelectItem value="Conversando">Conversando</SelectItem>
                        <SelectItem value="Interessado">Interessado</SelectItem>
                        <SelectItem value="Fechado">Fechado</SelectItem>
                        <SelectItem value="Perdido">Perdido</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quick Select Buttons */}
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllByStatus("Novo")}
                      className="justify-between"
                    >
                      <span>Todos Novos</span>
                      <Badge variant="secondary">{contacts.filter((c) => c.status === "Novo").length}</Badge>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSelectAllByStatus("Interessado")}
                      className="justify-between"
                    >
                      <span>Todos Interessados</span>
                      <Badge variant="secondary">{contacts.filter((c) => c.status === "Interessado").length}</Badge>
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => setSelectedContacts([])}>
                      <XCircle className="w-4 h-4 mr-1" />
                      Limpar Seleção
                    </Button>
                  </div>

                  <Separator />

                  {/* Contact List */}
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {filteredContacts.map((contact) => (
                      <div
                        key={contact.id}
                        className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors ${
                          selectedContacts.includes(contact.id) ? "bg-primary/5 border-primary/20" : ""
                        }`}
                      >
                        <Checkbox
                          checked={selectedContacts.includes(contact.id)}
                          onCheckedChange={(checked) => handleContactSelection(contact.id, checked as boolean)}
                          disabled={!selectedContacts.includes(contact.id) && (selectedContacts.length >= remainingLimit || userCredits < ((selectedContacts.length + 1) * MESSAGE_COST))}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{contact.name}</p>
                          <p className="text-sm text-muted-foreground truncate">{contact.contact}</p>
                        </div>
                        <div className="flex flex-col items-end space-y-1">
                          <Badge variant="outline" className="text-xs">
                            {contact.status}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {contact.source}
                          </Badge>
                        </div>
                      </div>
                    ))}

                    {filteredContacts.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Nenhum contato encontrado</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5" />
                    <span>Templates de Mensagens</span>
                  </CardTitle>
                  <CardDescription>Gerencie seus templates de mensagens reutilizáveis</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Buscar templates..."
                      value={templateSearch}
                      onChange={(e) => setTemplateSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            {template.category}
                          </Badge>
                        </div>
                        <TemplateActions template={template} />
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {template.mediaUrl && (
                          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded">
                            {template.mediaType === "image" ? (
                              <ImageIcon className="h-4 w-4 text-blue-500" />
                            ) : (
                              <File className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-xs text-muted-foreground truncate">{template.fileName}</span>
                          </div>
                        )}

                        {(template.message || template.caption) && (
                          <div className="bg-muted/50 p-3 rounded text-sm max-h-24 overflow-y-auto">
                            {template.caption || template.message}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{(template.message || template.caption || "").length} caracteres</span>
                          <span>Usado {template.usageCount} vezes</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(template.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {filteredTemplates.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum template encontrado</h3>
                    <p>Crie seu primeiro template na aba "Criar Campanha"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Send className="w-5 h-5" />
                    <span>Campanhas</span>
                  </CardTitle>
                  <CardDescription>Gerencie suas campanhas de mensagens em massa</CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCampaignView(campaignView === "grid" ? "list" : "grid")}
                  >
                    {campaignView === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={campaignView === "grid" ? "grid grid-cols-1 lg:grid-cols-2 gap-6" : "space-y-4"}>
                {campaigns.map((campaign) => (
                  <Card key={campaign.id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg">{campaign.name}</CardTitle>
                          <p className="text-sm text-muted-foreground">
                            Criada em {new Date(campaign.createdAt).toLocaleString()}
                          </p>
                          {campaign.scheduledAt && (
                            <p className="text-sm text-purple-600">
                              {campaign.status === "SCHEDULED" ? "Agendada para" : "Executada em"}: {new Date(campaign.scheduledAt).toLocaleString()}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">{getStatusBadge(campaign.status)}</div>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-4">
                        {campaign.mediaUrl && (
                          <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded">
                            {campaign.mediaType === "image" ? (
                              <ImageIcon className="h-4 w-4 text-blue-500" />
                            ) : (
                              <File className="h-4 w-4 text-green-500" />
                            )}
                            <span className="text-xs text-muted-foreground truncate">{campaign.fileName}</span>
                            <Button variant="ghost" size="sm" onClick={() => window.open(campaign.mediaUrl, "_blank")}>
                              <Download className="h-3 w-3" />
                            </Button>
                          </div>
                        )}

                        {(campaign.message || campaign.caption) && (
                          <div className="bg-muted/50 p-3 rounded text-sm max-h-20 overflow-y-auto">
                            {campaign.caption || campaign.message}
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-muted-foreground">Total</p>
                            <p className="font-semibold text-lg">{campaign.totalContacts}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Enviadas</p>
                            <p className="font-semibold text-lg text-green-600">{campaign.sentCount}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-muted-foreground">Falharam</p>
                            <p className="font-semibold text-lg text-red-600">{campaign.failedCount}</p>
                          </div>
                        </div>

                        {campaign.totalContacts > 0 && (
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span>Progresso</span>
                              <span>{Math.round((campaign.sentCount / campaign.totalContacts) * 100)}%</span>
                            </div>
                            <Progress value={(campaign.sentCount / campaign.totalContacts) * 100} className="h-2" />
                          </div>
                        )}

                        <div className="flex flex-wrap gap-2">
                          {canEditCampaign(campaign.status) && (
                            <Button variant="outline" size="sm" onClick={() => editCampaign(campaign)}>
                              <Edit className="w-4 h-4 mr-1" />
                              Editar
                            </Button>
                          )}

                          {campaign.status === "RUNNING" && (
                            <Button variant="outline" size="sm" onClick={() => pauseCampaign(campaign.id)}>
                              <Pause className="w-4 h-4 mr-1" />
                              Pausar
                            </Button>
                          )}

                          {campaign.status === "PAUSED" && (
                            <Button variant="outline" size="sm" onClick={() => resumeCampaign(campaign.id)}>
                              <Play className="w-4 h-4 mr-1" />
                              Retomar
                            </Button>
                          )}

                          {canRestartCampaign(campaign.status) && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => restartCampaign(campaign.id)}
                              disabled={restartingCampaign === campaign.id}
                              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              {restartingCampaign === campaign.id ? (
                                <RotateCcw className="w-4 h-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="w-4 h-4 mr-1" />
                              )}
                              Reiniciar
                            </Button>
                          )}

                          {canDeleteCampaign(campaign.status) && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50 bg-transparent"
                                  disabled={deletingCampaign === campaign.id}
                                >
                                  {deletingCampaign === campaign.id ? (
                                    <RotateCcw className="w-4 h-4 mr-1 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4 mr-1" />
                                  )}
                                  Deletar
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Tem certeza que deseja deletar a campanha "{campaign.name}"? Esta ação não pode ser
                                    desfeita e todos os dados relacionados serão perdidos.
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => deleteCampaign(campaign.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Deletar Campanha
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {campaigns.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground">
                    <Send className="w-16 h-16 mx-auto mb-4 opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma campanha criada ainda</h3>
                    <p>Crie sua primeira campanha na aba "Criar"</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Campanhas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{campaigns.length}</div>
                <p className="text-xs text-muted-foreground">campanhas criadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas Ativas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                  {campaigns.filter((c) => c.status === "RUNNING").length}
                </div>
                <p className="text-xs text-muted-foreground">em execução</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Campanhas Agendadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">
                  {campaigns.filter((c) => c.status === "SCHEDULED").length}
                </div>
                <p className="text-xs text-muted-foreground">agendadas</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Taxa de Sucesso</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">
                  {campaigns.length > 0
                    ? Math.round(
                        (campaigns.reduce((acc, campaign) => acc + campaign.sentCount, 0) /
                          campaigns.reduce((acc, campaign) => acc + campaign.totalContacts, 0)) *
                          100,
                      )
                    : 0}
                  %
                </div>
                <p className="text-xs text-muted-foreground">de sucesso</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Campanhas Recentes</CardTitle>
                <CardDescription>Últimas campanhas criadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.slice(0, 5).map((campaign) => (
                    <div key={campaign.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{campaign.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {campaign.sentCount}/{campaign.totalContacts} enviadas
                        </p>
                        {campaign.scheduledAt && campaign.status === "SCHEDULED" && (
                          <p className="text-xs text-purple-600">
                            Agendada para {new Date(campaign.scheduledAt).toLocaleString()}
                          </p>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">{getStatusBadge(campaign.status)}</div>
                    </div>
                  ))}
                  {campaigns.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <Send className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhuma campanha encontrada</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Templates Mais Usados</CardTitle>
                <CardDescription>Templates salvos para reutilização</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {templates
                    .sort((a, b) => b.usageCount - a.usageCount)
                    .slice(0, 5)
                    .map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{template.name}</p>
                          <p className="text-sm text-muted-foreground">{template.category}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">{template.usageCount} usos</Badge>
                          <Button variant="outline" size="sm" onClick={() => useTemplateWithContacts(template)}>
                            <Send className="w-4 h-4 mr-1" />
                            Usar
                          </Button>
                        </div>
                      </div>
                    ))}
                  {templates.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Nenhum template encontrado</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog para usar template com seleção de contatos */}
      <Dialog open={showUseTemplateDialog} onOpenChange={setShowUseTemplateDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Usar Template: {templateToUse?.name}</DialogTitle>
            <DialogDescription>Selecione os contatos e a instância para enviar esta mensagem</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Preview da mensagem */}
            <div className="space-y-2">
              <Label>Conteúdo do Template</Label>

              {templateToUse?.mediaUrl && (
                <div className="flex items-center space-x-2 p-2 bg-muted/50 rounded">
                  {templateToUse.mediaType === "image" ? (
                    <ImageIcon className="h-4 w-4 text-blue-500" />
                  ) : (
                    <File className="h-4 w-4 text-green-500" />
                  )}
                  <span className="text-sm text-muted-foreground">{templateToUse.fileName}</span>
                  <Button variant="ghost" size="sm" onClick={() => window.open(templateToUse.mediaUrl, "_blank")}>
                    <Download className="h-3 w-3" />
                  </Button>
                </div>
              )}

              {(templateToUse?.message || templateToUse?.caption) && (
                <div className="bg-muted/50 p-4 rounded-lg text-sm max-h-32 overflow-y-auto">
                  {templateToUse?.caption || templateToUse?.message}
                </div>
              )}
            </div>

            {/* Seleção de instância */}
            <div className="space-y-2">
              <Label>Instância WhatsApp</Label>
              <Select value={selectedInstance} onValueChange={setSelectedInstance}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma instância" />
                </SelectTrigger>
                <SelectContent>
                  {instances.map((instance) => (
                    <SelectItem key={instance.id} value={instance.id}>
                      {instance.instanceName} - {instance.status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro de contatos */}
            <div className="space-y-2">
              <Label>Filtrar Contatos</Label>
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Conversando">Conversando</SelectItem>
                    <SelectItem value="Interessado">Interessado</SelectItem>
                    <SelectItem value="Fechado">Fechado</SelectItem>
                    <SelectItem value="Perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => handleSelectAllByStatus("Novo")}>
                  Todos Novos
                </Button>
                <Button variant="outline" onClick={() => handleSelectAllByStatus("Interessado")}>
                  Interessados
                </Button>
                <Button variant="outline" onClick={() => setSelectedContacts([])}>
                  Limpar
                </Button>
              </div>
            </div>

            {/* Lista de contatos */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Contatos ({selectedContacts.length} selecionados)</Label>
                <Badge variant="outline">Limite: {remainingLimit} restantes</Badge>
              </div>
              <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center space-x-3 p-2 border rounded hover:bg-muted/50 transition-colors ${
                      selectedContacts.includes(contact.id) ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <Checkbox
                      checked={selectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleContactSelection(contact.id, checked as boolean)}
                      disabled={!selectedContacts.includes(contact.id) && (selectedContacts.length >= remainingLimit || userCredits < ((selectedContacts.length + 1) * MESSAGE_COST))}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{contact.contact}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs">
                        {contact.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {contact.source}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações do envio */}
            {selectedContacts.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Cronograma:</strong> {selectedContacts.length} mensagens serão enviadas em{" "}
                  {Math.ceil(selectedContacts.length / 50)} lote(s) com intervalo de 30 minutos.
                  <br />
                  <strong>Custo estimado:</strong> R${(selectedContacts.length * MESSAGE_COST).toFixed(2)}
                  <br />
                  <strong>Método:</strong> Arquivos serão convertidos para Base64 automaticamente
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowUseTemplateDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={createCampaignFromTemplate}
              disabled={loading || !selectedInstance || selectedContacts.length === 0 || userCredits < (selectedContacts.length * MESSAGE_COST)}
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Criar Campanha ({selectedContacts.length} contatos)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para editar campanha */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Campanha: {editingCampaign?.name}</DialogTitle>
            <DialogDescription>Modifique os dados da campanha</DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Nome da campanha */}
            <div className="space-y-2">
              <Label htmlFor="editCampaignName">Nome da Campanha</Label>
              <Input
                id="editCampaignName"
                placeholder="Ex: Promoção Black Friday"
                value={editCampaignName}
                onChange={(e) => setEditCampaignName(e.target.value)}
              />
            </div>

            {/* Agendamento */}
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="editSchedule"
                  checked={editIsScheduled}
                  onCheckedChange={(checked) => setEditIsScheduled(checked as boolean)}
                />
                <Label htmlFor="editSchedule" className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4" />
                  <span>Agendar campanha</span>
                </Label>
              </div>

              {editIsScheduled && (
                <div className="space-y-2">
                  <Label htmlFor="editScheduledAt">Data e Hora do Envio</Label>
                  <Input
                    id="editScheduledAt"
                    type="datetime-local"
                    value={editScheduledAt}
                    onChange={(e) => setEditScheduledAt(e.target.value)}
                    min={new Date().toISOString().slice(0, 16)}
                  />
                </div>
              )}
            </div>

            {/* Upload de arquivo */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Mídia (Opcional)</Label>
                <Badge variant="outline" className="text-xs">
                  Imagens, Documentos - Máx. 3MB
                </Badge>
              </div>

              {!editUploadedFile ? (
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
                  <div className="text-center space-y-2">
                    <div className="flex justify-center space-x-2">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                      <File className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <Label htmlFor="edit-file-upload" className="cursor-pointer">
                        <div className="text-sm text-muted-foreground">
                          <span className="font-medium text-primary hover:text-primary/80">
                            Clique para enviar
                          </span>{" "}
                          ou arraste e solte
                        </div>
                        <div className="text-xs text-muted-foreground mt-1">
                          JPG, PNG, GIF, PDF, DOC, XLS, etc. (Máx. 3MB)
                        </div>
                      </Label>
                      <Input
                        id="edit-file-upload"
                        type="file"
                        className="hidden"
                        accept=".jpg,.jpeg,.png,.gif,.bmp,.webp,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.zip,.rar"
                        onChange={handleEditFileUpload}
                        disabled={uploading}
                      />
                    </div>
                    {uploading && (
                      <div className="flex items-center justify-center space-x-2">
                        <RotateCcw className="h-4 w-4 animate-spin" />
                        <span className="text-sm">Enviando...</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg p-4 bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {editUploadedFile.mediaType === "image" ? (
                        <ImageIcon className="h-8 w-8 text-blue-500" />
                      ) : (
                        <File className="h-8 w-8 text-green-500" />
                      )}
                      <div>
                        <p className="font-medium text-sm">{editUploadedFile.fileName}</p>
                        <p className="text-xs text-muted-foreground">
                          {editUploadedFile.mediaType}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="sm" onClick={() => window.open(editUploadedFile.url, "_blank")}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={removeEditUploadedFile}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {editUploadedFile && (
                <div className="space-y-2">
                  <Label htmlFor="editCaption">Legenda da Mídia</Label>
                  <Textarea
                    id="editCaption"
                    placeholder="Digite uma legenda para a mídia..."
                    rows={3}
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="resize-none"
                  />
                </div>
              )}
            </div>

            {/* Mensagem */}
            <div className="space-y-2">
              <Label htmlFor="editMessage">Mensagem {editUploadedFile ? "(Opcional)" : ""}</Label>
              <Textarea
                id="editMessage"
                placeholder={editUploadedFile ? "Mensagem opcional..." : "Digite sua mensagem aqui..."}
                rows={6}
                value={editMessage}
                onChange={(e) => setEditMessage(e.target.value)}
                className="resize-none"
              />
            </div>

            {/* Seleção de contatos */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Contatos Selecionados</Label>
                <Badge variant="outline" className="bg-primary/10">
                  {editSelectedContacts.length} selecionados
                </Badge>
              </div>

              {/* Filtro de contatos */}
              <div className="flex gap-2">
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="flex-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="Novo">Novo</SelectItem>
                    <SelectItem value="Conversando">Conversando</SelectItem>
                    <SelectItem value="Interessado">Interessado</SelectItem>
                    <SelectItem value="Fechado">Fechado</SelectItem>
                    <SelectItem value="Perdido">Perdido</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" onClick={() => handleEditSelectAllByStatus("Novo")}>
                  Todos Novos
                </Button>
                <Button variant="outline" onClick={() => handleEditSelectAllByStatus("Interessado")}>
                  Interessados
                </Button>
                <Button variant="outline" onClick={() => setEditSelectedContacts([])}>
                  Limpar
                </Button>
              </div>

              {/* Lista de contatos */}
              <div className="max-h-60 overflow-y-auto border rounded-lg p-2 space-y-2">
                {filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    className={`flex items-center space-x-3 p-2 border rounded hover:bg-muted/50 transition-colors ${
                      editSelectedContacts.includes(contact.id) ? "bg-primary/5 border-primary/20" : ""
                    }`}
                  >
                    <Checkbox
                      checked={editSelectedContacts.includes(contact.id)}
                      onCheckedChange={(checked) => handleEditContactSelection(contact.id, checked as boolean)}
                      disabled={!editSelectedContacts.includes(contact.id) && (editSelectedContacts.length >= remainingLimit || userCredits < ((editSelectedContacts.length + 1) * MESSAGE_COST))}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{contact.name}</p>
                      <p className="text-sm text-muted-foreground truncate">{contact.contact}</p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Badge variant="outline" className="text-xs">
                        {contact.status}
                      </Badge>
                      <Badge variant="secondary" className="text-xs">
                        {contact.source}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Informações do envio */}
            {editSelectedContacts.length > 0 && (
              <Alert className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
                <Clock className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800 dark:text-blue-200">
                  <strong>Cronograma:</strong> {editSelectedContacts.length} mensagens serão enviadas em{" "}
                  {Math.ceil(editSelectedContacts.length / 50)} lote(s) com intervalo de 30 minutos.
                  <br />
                  <strong>Custo estimado:</strong> R${(editSelectedContacts.length * MESSAGE_COST).toFixed(2)}
                  {editIsScheduled && editScheduledAt && (
                    <>
                      <br />
                      <strong>Agendamento:</strong> Campanha iniciará em {new Date(editScheduledAt).toLocaleString()}
                    </>
                  )}
                </AlertDescription>
              </Alert>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancelar
            </Button>
            <Button
              onClick={updateCampaign}
              disabled={loading || editSelectedContacts.length === 0 || userCredits < (editSelectedContacts.length * MESSAGE_COST)}
            >
              {loading ? (
                <>
                  <RotateCcw className="w-4 h-4 mr-2 animate-spin" />
                  Atualizando...
                </>
              ) : (
                <>
                  <Edit className="w-4 h-4 mr-2" />
                  Atualizar Campanha ({editSelectedContacts.length} contatos)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
