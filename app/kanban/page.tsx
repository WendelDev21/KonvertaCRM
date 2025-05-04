"use client"

import { KanbanBoard } from "@/components/kanban/kanban-board"

export default function KanbanPage() {
  return (
    <div className="h-[calc(100vh-4rem)] p-4">
      <div className="mb-4">
        <h1 className="text-2xl font-bold">Kanban de Contatos</h1>
        <p className="text-muted-foreground">Arraste e solte os contatos entre as colunas para atualizar seu status</p>
      </div>

      <div className="h-[calc(100%-5rem)]">
        <KanbanBoard />
      </div>
    </div>
  )
}
