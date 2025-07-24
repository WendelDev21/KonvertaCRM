'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Avatar, AvatarFallback, AvatarInitials } from "@/components/ui/avatar"
import { Search, Settings, MessageCircle, Phone, User, Wifi, WifiOff } from 'lucide-react'
import Link from "next/link"

interface Contact {
  id: string
  name: string
  contact: string
  source: string
  status: string
  createdAt: string
  notes?: string
  value?: number
  hasActiveChat?: boolean
}

interface WhatsAppInstance {
  id: string
  instanceName: string
  status: string
  qrCode?: string
  createdAt: string
}

interface Message {
  id: string
  messageId: string
  fromMe: boolean
  remoteJid: string
  messageText: string
  messageType: string
  timestamp: string
}

const statusColors = {
  'Novo': 'bg-blue-500',
  'Conversando': 'bg-yellow-500', 
  'Interessado': 'bg-green-500',
  'Fechado': 'bg-gray-500',
  'Perdido': 'bg-red-500'
}

const statusLabels = {
  'Novo': 'Novos',
  'Conversando': 'Em Conversa', 
  'Interessado': 'Interessados',
  'Fechado': 'Fechados',
  'Perdido': 'Perdidos'
}

export default function Atendimentos() {
  const { data: session } = useSession()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [instances, setInstances] = useState<WhatsAppInstance[]>([])
  const [messages, setMessages] = useState<Message[]>([])
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')

  // Carregar dados iniciais
  useEffect(() => {
    if (session?.user?.id) {
      loadContacts()
      loadInstances()
    }
  }, [session])

  // Carregar mensagens quando um contato é selecionado
  useEffect(() => {
    if (selectedContact && instances.length > 0) {
      loadMessages(selectedContact.contact)
    }
  }, [selectedContact, instances])

  const loadContacts = async () => {
    try {
      const response = await fetch('/api/contacts')
      if (response.ok) {
        const data = await response.json()
        // Simular se tem chat ativo baseado no status
        const contactsWithChat = data.map((contact: Contact) => ({
          ...contact,
          hasActiveChat: contact.status === 'Conversando'
        }))
        setContacts(contactsWithChat)
      }
    } catch (error) {
      console.error('Erro ao carregar contatos:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadInstances = async () => {
    try {
      const response = await fetch('/api/whatsapp/instances')
      if (response.ok) {
        const data = await response.json()
        setInstances(data)
      }
    } catch (error) {
      console.error('Erro ao carregar instâncias:', error)
    }
  }

  const loadMessages = async (contactNumber: string) => {
    // Simular carregamento de mensagens
    // Na implementação real, você buscaria mensagens do banco filtradas por contato
    setMessages([
      {
        id: '1',
        messageId: 'msg1',
        fromMe: false,
        remoteJid: contactNumber,
        messageText: 'Olá, gostaria de mais informações sobre seus produtos.',
        messageType: 'text',
        timestamp: new Date().toISOString()
      },
      {
        id: '2', 
        messageId: 'msg2',
        fromMe: true,
        remoteJid: contactNumber,
        messageText: 'Olá! Claro, ficarei feliz em ajudar. Que tipo de produto você está procurando?',
        messageType: 'text',
        timestamp: new Date().toISOString()
      }
    ])
  }

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedContact) return

    // Adicionar mensagem localmente
    const message: Message = {
      id: Date.now().toString(),
      messageId: `msg_${Date.now()}`,
      fromMe: true,
      remoteJid: selectedContact.contact,
      messageText: newMessage,
      messageType: 'text',
      timestamp: new Date().toISOString()
    }

    setMessages(prev => [...prev, message])
    setNewMessage('')

    // Atualizar status do contato para "Conversando" se necessário
    if (selectedContact.status === 'Novo') {
      await updateContactStatus(selectedContact.id, 'Conversando')
    }
  }

  const updateContactStatus = async (contactId: string, status: string) => {
    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })
      
      if (response.ok) {
        loadContacts() // Recarregar contatos
      }
    } catch (error) {
      console.error('Erro ao atualizar status:', error)
    }
  }

  // Filtrar contatos
  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contact.contact.includes(searchTerm)
    const matchesStatus = selectedStatus === 'all' || contact.status === selectedStatus
    return matchesSearch && matchesStatus
  })

  // Contar contatos por status
  const statusCounts = contacts.reduce((acc, contact) => {
    acc[contact.status] = (acc[contact.status] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">Carregando...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 h-screen flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Atendimentos</h1>
          <p className="text-muted-foreground">Gerencie seus atendimentos via WhatsApp</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0">
        {/* Sidebar Esquerda - Contatos */}
        <div className="col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">Contatos</CardTitle>
              
              {/* Barra de Pesquisa */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar contatos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0">
              {/* Status Filters */}
              <div className="px-6 pb-4">
                <div className="space-y-2">
                  <Button
                    variant={selectedStatus === 'all' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedStatus('all')}
                    className="w-full justify-start"
                  >
                    Todos ({contacts.length})
                  </Button>
                  
                  {Object.entries(statusLabels).map(([status, label]) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedStatus(status)}
                      className="w-full justify-start"
                    >
                      <div className={`w-2 h-2 rounded-full mr-2 ${statusColors[status as keyof typeof statusColors]}`} />
                      {label} ({statusCounts[status] || 0})
                    </Button>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Lista de Contatos */}
              <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors hover:bg-muted/50 ${
                        selectedContact?.id === contact.id ? 'bg-muted border-primary' : ''
                      }`}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {contact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm truncate">{contact.name}</p>
                            {contact.hasActiveChat && (
                              <MessageCircle className="h-3 w-3 text-green-500" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">{contact.contact}</p>
                          <Badge variant="secondary" className="text-xs mt-1">
                            {contact.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Área Central - Chat */}
        <div className="col-span-6 flex flex-col">
          <Card className="flex-1 flex flex-col">
            {selectedContact ? (
              <>
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarFallback>
                        {selectedContact.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedContact.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">{selectedContact.contact}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto">
                      {selectedContact.status}
                    </Badge>
                  </div>
                </CardHeader>

                <Separator />

                {/* Mensagens */}
                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] p-3 rounded-lg ${
                            message.fromMe
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <p className="text-sm">{message.messageText}</p>
                          <p className="text-xs opacity-70 mt-1">
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>

                <Separator />

                {/* Input de Mensagem */}
                <div className="p-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Digite sua mensagem..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={sendMessage} disabled={!newMessage.trim()}>
                      Enviar
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Selecione um contato para iniciar o atendimento</p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>

        {/* Sidebar Direita - Instâncias */}
        <div className="col-span-3 flex flex-col">
          <Card className="flex-1 flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Instâncias WhatsApp</CardTitle>
                <Link href="/whatsapp">
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardHeader>

            <CardContent className="flex-1">
              <ScrollArea className="h-full">
                <div className="space-y-3">
                  {instances.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Wifi className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Nenhuma instância encontrada</p>
                      <Link href="/whatsapp">
                        <Button variant="outline" size="sm" className="mt-2">
                          Criar Instância
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    instances.map((instance) => (
                      <div
                        key={instance.id}
                        className="p-3 rounded-lg border bg-card"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0">
                            {instance.status === 'connected' ? (
                              <Wifi className="h-5 w-5 text-green-500" />
                            ) : (
                              <WifiOff className="h-5 w-5 text-red-500" />
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {instance.instanceName}
                            </p>
                            <Badge 
                              variant={instance.status === 'connected' ? 'default' : 'secondary'}
                              className="text-xs mt-1"
                            >
                              {instance.status === 'connected' ? 'Conectada' : 'Desconectada'}
                            </Badge>
                          </div>

                          <Link href="/whatsapp">
                            <Button variant="ghost" size="sm">
                              <Settings className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
