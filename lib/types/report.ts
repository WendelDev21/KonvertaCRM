export interface Report {
  id: string
  userId: string
  format: "pdf" | "csv"
  period: "7d" | "30d" | "90d" | "1y" | "custom"
  startDate?: string
  endDate?: string
  includeContacts: boolean
  includeFinancial: boolean
  fileName?: string
  fileUrl?: string
  createdAt: string
}
