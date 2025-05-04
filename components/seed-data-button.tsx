"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2, Sprout } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

export function SeedDataButton() {
  const [isLoading, setIsLoading] = useState(false)

  const handleSeedData = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/seed", {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Failed to seed data")
      }

      toast({
        title: "Success",
        description: "Sample data has been added to your account",
      })
    } catch (error) {
      console.error("Error seeding data:", error)
      toast({
        title: "Error",
        description: "Failed to seed data. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSeedData} disabled={isLoading} variant="outline" size="sm">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Adding sample data...
        </>
      ) : (
        <>
          <Sprout className="mr-2 h-4 w-4" />
          Add sample data
        </>
      )}
    </Button>
  )
}
