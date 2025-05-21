"use client"

import type React from "react"
import { useState } from "react"
import { useToast } from "@/components/ui/use-toast"

type ContactFormProps = {}

const ContactForm: React.FC<ContactFormProps> = () => {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [message, setMessage] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, message }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Success:", data)
      toast({
        title: "Mensagem enviada!",
        description: "Sua mensagem foi enviada com sucesso.",
      })
      setName("")
      setEmail("")
      setMessage("")
    } catch (error: any) {
      console.error("Error:", error)
      if (error.response && error.response.status === 403) {
        try {
          const errorData = await error.response.json()
          toast({
            title: "Limite de contatos atingido",
            description: errorData.message || "Você atingiu o limite de contatos do seu plano atual.",
            variant: "destructive",
          })
        } catch (jsonError) {
          toast({
            title: "Erro",
            description: "Ocorreu um erro ao processar a resposta do servidor.",
            variant: "destructive",
          })
        }
        return
      }
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao enviar a mensagem.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Nome
        </label>
        <input
          type="text"
          id="name"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <input
          type="email"
          id="email"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Mensagem
        </label>
        <textarea
          id="message"
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
        />
      </div>
      <div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:bg-gray-400"
        >
          {isSubmitting ? "Enviando..." : "Enviar"}
        </button>
      </div>
    </form>
  )
}

export default ContactForm
