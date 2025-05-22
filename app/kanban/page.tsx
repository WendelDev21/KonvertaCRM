"use client"

import { KanbanBoard } from "@/components/kanban/kanban-board"

export default function KanbanPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <main className="flex-1 container mx-auto py-6 px-4">
        <div className="flex flex-col gap-6 animate-fade-in">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold">Kanban</h1>
              <p className="text-muted-foreground mt-1">Gerencie seus contatos com facilidade</p>
            </div>
          </div>
          <div className="h-[calc(100%-5rem)]">
            <KanbanBoard />
          </div>
        </div>
      </main>
    

      
    </div>
  )
}
