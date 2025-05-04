import { prisma, dbAction } from "../db-client"
import type { ContactStatus, ContactSource } from "./contact-service"

export async function getStatusDistribution(userId: string) {
  return dbAction(async () => {
    const counts = await prisma.contact.groupBy({
      by: ["status"],
      where: { userId },
      _count: {
        status: true,
      },
    })

    // Initialize with zeros
    const result: Record<ContactStatus, number> = {
      Novo: 0,
      Conversando: 0,
      Interessado: 0,
      Fechado: 0,
      Perdido: 0,
    }

    // Fill with actual results
    counts.forEach((count) => {
      result[count.status as ContactStatus] = count._count.status
    })

    return result
  })
}

export async function getSourceDistribution(userId: string) {
  return dbAction(async () => {
    const counts = await prisma.contact.groupBy({
      by: ["source"],
      where: { userId },
      _count: {
        source: true,
      },
    })

    // Initialize with zeros
    const result: Record<ContactSource, number> = {
      WhatsApp: 0,
      Instagram: 0,
      Outro: 0,
    }

    // Fill with actual results
    counts.forEach((count) => {
      result[count.source as ContactSource] = count._count.source
    })

    return result
  })
}

export async function getActivityTimeline(userId: string, startDate: Date, endDate: Date, source?: string) {
  return dbAction(async () => {
    const whereClause: any = {
      userId,
    }

    // Adicionar filtro de origem se fornecido
    if (source && source !== "Todos") {
      whereClause.source = source
    }

    // Buscar todos os contatos do usuário para análise
    const contacts = await prisma.contact.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        status: true,
        updatedAt: true,
      },
      orderBy: {
        createdAt: "asc",
      },
    })

    // Função para normalizar a data para o formato YYYY-MM-DD sem ajuste de fuso horário
    const normalizeDate = (date: Date): string => {
      // Extrair ano, mês e dia diretamente do objeto Date
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, "0")
      const day = String(date.getDate()).padStart(2, "0")
      return `${year}-${month}-${day}`
    }

    // Obter a data atual normalizada (apenas YYYY-MM-DD)
    const today = new Date()
    const normalizedToday = normalizeDate(today)

    // Garantir que a data final não seja posterior à data atual
    let actualEndDate: Date
    if (normalizeDate(endDate) > normalizedToday) {
      // Se a data final for no futuro, use a data atual
      actualEndDate = today
    } else {
      actualEndDate = endDate
    }

    // Group by day
    const dailyData: Record<
      string,
      { date: string; novos: number; conversando: number; interessado: number; fechados: number; perdidos: number }
    > = {}

    // Inicializar todos os dias no intervalo (até o dia atual)
    const currentDate = new Date(startDate)

    while (normalizeDate(currentDate) <= normalizeDate(actualEndDate)) {
      // Usar apenas a parte da data (YYYY-MM-DD) sem ajuste de fuso horário
      const dateStr = normalizeDate(currentDate)

      dailyData[dateStr] = {
        date: dateStr,
        novos: 0,
        conversando: 0,
        interessado: 0,
        fechados: 0,
        perdidos: 0,
      }

      // Avançar para o próximo dia
      currentDate.setDate(currentDate.getDate() + 1)
    }

    // Preencher com dados reais
    contacts.forEach((contact) => {
      // Normalizar a data do contato para evitar problemas de fuso horário
      const contactDate = normalizeDate(contact.createdAt)

      // Normalizar as datas de início e fim para comparação
      const normalizedStartDate = normalizeDate(startDate)
      const normalizedEndDate = normalizeDate(actualEndDate)

      // Verificar se a data está dentro do intervalo que queremos mostrar
      // e não é uma data futura
      if (contactDate < normalizedStartDate || contactDate > normalizedEndDate || contactDate > normalizedToday) {
        return // Pular este contato se estiver fora do intervalo ou for futuro
      }

      // Garantir que a data existe no nosso objeto
      if (!dailyData[contactDate]) {
        dailyData[contactDate] = {
          date: contactDate,
          novos: 0,
          conversando: 0,
          interessado: 0,
          fechados: 0,
          perdidos: 0,
        }
      }

      // Incrementar o contador apropriado com base no status atual
      if (contact.status === "Novo") {
        dailyData[contactDate].novos++
      } else if (contact.status === "Conversando") {
        dailyData[contactDate].conversando++
      } else if (contact.status === "Interessado") {
        dailyData[contactDate].interessado++
      } else if (contact.status === "Fechado") {
        dailyData[contactDate].fechados++
      } else if (contact.status === "Perdido") {
        dailyData[contactDate].perdidos++
      }
    })

    // Converter para array e ordenar por data
    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date))
  })
}

export async function getConversionRates(userId: string) {
  const [statusCounts, statusError] = await getStatusDistribution(userId)

  if (!statusCounts || statusError) {
    return [[], new Error("Failed to get status counts")]
  }

  // Calculate conversion rates
  const totalContacts = Object.values(statusCounts).reduce((sum, count) => sum + count, 0)

  if (totalContacts === 0) {
    return [
      [
        { name: "Novo → Conversando", taxa: 0 },
        { name: "Conversando → Interessado", taxa: 0 },
        { name: "Interessado → Fechado", taxa: 0 },
      ],
      null,
    ]
  }

  // Calculate simulated conversion rates
  const rates = [
    {
      name: "Novo → Conversando",
      taxa: Math.round((statusCounts.Conversando / Math.max(statusCounts.Novo, 1)) * 100),
    },
    {
      name: "Conversando → Interessado",
      taxa: Math.round((statusCounts.Interessado / Math.max(statusCounts.Conversando, 1)) * 100),
    },
    {
      name: "Interessado → Fechado",
      taxa: Math.round((statusCounts.Fechado / Math.max(statusCounts.Interessado, 1)) * 100),
    },
  ]

  return [rates, null]
}

export async function getDashboardData(userId: string, startDate: Date, endDate: Date, source?: string) {
  const [statusCounts, statusError] = await getStatusDistribution(userId)
  const [sourceCounts, sourceError] = await getSourceDistribution(userId)
  const [activityTimeline, activityError] = await getActivityTimeline(userId, startDate, endDate, source)
  const [conversionRates, conversionError] = await getConversionRates(userId)

  if (statusError || sourceError || activityError || conversionError) {
    return [null, new Error("Failed to fetch dashboard data")]
  }

  return [
    {
      statusCounts,
      sourceCounts,
      activityTimeline,
      conversionRates,
    },
    null,
  ]
}
