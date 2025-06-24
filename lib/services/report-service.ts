import prisma from "@/lib/prisma"
import { subDays, subYears, format } from "date-fns"
import { ptBR } from "date-fns/locale"

// Tipos
type ReportFormat = "pdf" | "csv"
type ReportPeriod = "7d" | "30d" | "90d" | "1y" | "custom"

interface ReportOptions {
  userId: string
  format: ReportFormat
  period: ReportPeriod
  startDate?: Date
  endDate?: Date
  includeContacts: boolean
  includeFinancial: boolean
}

interface ReportResult {
  fileContent: Buffer | string
  contentType: string
  fileName: string
}

// Função principal para gerar relatórios
export async function generateReport(options: ReportOptions): Promise<ReportResult> {
  const { userId, format, period, startDate, endDate, includeContacts, includeFinancial } = options

  // Calcular datas com base no período
  const { fromDate, toDate } = calculateDateRange(period, startDate, endDate)

  // Buscar dados
  const data = await fetchReportData(userId, fromDate, toDate, includeContacts, includeFinancial)

  // Gerar o arquivo do relatório
  if (format === "pdf") {
    return generatePdfReport(data, options, fromDate, toDate)
  } else {
    return generateCsvReport(data, options, fromDate, toDate)
  }
}

// Calcular intervalo de datas com base no período
function calculateDateRange(period: ReportPeriod, startDate?: Date, endDate?: Date): { fromDate: Date; toDate: Date } {
  const toDate = new Date()
  let fromDate: Date

  switch (period) {
    case "7d":
      fromDate = subDays(toDate, 7)
      break
    case "30d":
      fromDate = subDays(toDate, 30)
      break
    case "90d":
      fromDate = subDays(toDate, 90)
      break
    case "1y":
      fromDate = subYears(toDate, 1)
      break
    case "custom":
      if (!startDate || !endDate) {
        throw new Error("Datas personalizadas são obrigatórias")
      }
      fromDate = startDate
      return { fromDate, toDate: endDate }
    default:
      fromDate = subDays(toDate, 30) // Padrão para 30 dias
  }

  return { fromDate, toDate }
}

// Buscar dados para o relatório
async function fetchReportData(
  userId: string,
  fromDate: Date,
  toDate: Date,
  includeContacts: boolean,
  includeFinancial: boolean,
) {
  const data: any = {}

  // Buscar dados de contatos
  if (includeContacts) {
    data.contacts = await prisma.contact.findMany({
      where: {
        userId,
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: "desc" },
    })

    // Estatísticas de contatos
    data.contactStats = {
      total: data.contacts.length,
      byStatus: await getContactCountByStatus(userId, fromDate, toDate),
      bySource: await getContactCountBySource(userId, fromDate, toDate),
    }
  }

  // Buscar dados financeiros
  if (includeFinancial) {
    // Dados financeiros por status
    data.financialByStatus = await getFinancialDataByStatus(userId, fromDate, toDate)

    // Dados financeiros por origem
    data.financialBySource = await getFinancialDataBySource(userId, fromDate, toDate)

    // Valor total
    data.totalValue = await getTotalFinancialValue(userId, fromDate, toDate)

    // Resumo financeiro
    data.financialSummary = {
      total: data.totalValue,
      fechado: data.financialByStatus.Fechado || 0,
      emNegociacao:
        (data.financialByStatus.Novo || 0) +
        (data.financialByStatus.Conversando || 0) +
        (data.financialByStatus.Interessado || 0),
      perdido: data.financialByStatus.Perdido || 0,
    }
  }

  return data
}

// Gerar nome do arquivo
function generateFileName(reportFormat: ReportFormat, period: ReportPeriod, fromDate: Date, toDate: Date): string {
  const dateStr = format(new Date(), "yyyy-MM-dd", { locale: ptBR })

  let periodLabel: string

  switch (period) {
    case "7d":
      periodLabel = "7_dias"
      break
    case "30d":
      periodLabel = "30_dias"
      break
    case "90d":
      periodLabel = "90_dias"
      break
    case "1y":
      periodLabel = "1_ano"
      break
    case "custom":
      const startStr = format(fromDate, "yyyy-MM-dd", { locale: ptBR })
      const endStr = format(toDate, "yyyy-MM-dd", { locale: ptBR })
      periodLabel = `${startStr}_a_${endStr}`
      break
    default:
      periodLabel = "periodo"
  }

  return `relatorio_${periodLabel}_${dateStr}.${reportFormat}`
}

// Gerar relatório em PDF usando jsPDF
async function generatePdfReport(
  data: any,
  options: ReportOptions,
  fromDate: Date,
  toDate: Date,
): Promise<ReportResult> {
  // Importar jsPDF dinamicamente
  const { jsPDF } = await import("jspdf")

  const { includeContacts, includeFinancial } = options

  // Criar novo documento PDF
  const doc = new jsPDF()

  let yPosition = 20
  const pageHeight = doc.internal.pageSize.height
  const margin = 20

  // Função para adicionar nova página se necessário
  const checkPageBreak = (neededSpace = 20) => {
    if (yPosition + neededSpace > pageHeight - margin) {
      doc.addPage()
      yPosition = 20
    }
  }

  // Título principal
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  const title =
    includeContacts && includeFinancial
      ? "Relatório de Contatos e Financeiro"
      : includeContacts
        ? "Relatório de Contatos"
        : "Relatório Financeiro"
  doc.text(title, margin, yPosition)
  yPosition += 15

  // Informações do período
  doc.setFontSize(12)
  doc.setFont("helvetica", "normal")
  doc.text(
    `Período: ${format(fromDate, "dd/MM/yyyy", { locale: ptBR })} até ${format(toDate, "dd/MM/yyyy", { locale: ptBR })}`,
    margin,
    yPosition,
  )
  yPosition += 8
  doc.text(`Data de geração: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}`, margin, yPosition)
  yPosition += 20

  // Seção de contatos
  if (includeContacts && data.contacts) {
    checkPageBreak(40)

    // Título da seção
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Dados de Contatos", margin, yPosition)
    yPosition += 15

    // Resumo
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Total de contatos no período: ${data.contactStats.total}`, margin, yPosition)
    yPosition += 15

    // Contatos por Status
    doc.setFont("helvetica", "bold")
    doc.text("Contatos por Status:", margin, yPosition)
    yPosition += 8
    doc.setFont("helvetica", "normal")

    for (const [status, count] of Object.entries(data.contactStats.byStatus)) {
      checkPageBreak()
      doc.text(`${status}: ${count}`, margin + 10, yPosition)
      yPosition += 6
    }
    yPosition += 10

    // Contatos por Origem
    checkPageBreak(30)
    doc.setFont("helvetica", "bold")
    doc.text("Contatos por Origem:", margin, yPosition)
    yPosition += 8
    doc.setFont("helvetica", "normal")

    for (const [source, count] of Object.entries(data.contactStats.bySource)) {
      checkPageBreak()
      doc.text(`${source}: ${count}`, margin + 10, yPosition)
      yPosition += 6
    }
    yPosition += 15

    // Lista de contatos (todos)
    if (data.contacts.length > 0) {
      checkPageBreak(40)
      doc.setFont("helvetica", "bold")
      doc.text("Lista de Contatos:", margin, yPosition)
      yPosition += 10
      doc.setFont("helvetica", "normal")
      doc.setFontSize(10)

      // Cabeçalho da tabela
      doc.setFont("helvetica", "bold")
      doc.text("Nome", margin, yPosition)
      doc.text("Contato", margin + 50, yPosition)
      doc.text("Origem", margin + 90, yPosition)
      doc.text("Status", margin + 130, yPosition)
      doc.text("Valor (R$)", margin + 160, yPosition)
      yPosition += 6
      doc.setFont("helvetica", "normal")

      // Linha separadora
      doc.setLineWidth(0.1)
      doc.line(margin, yPosition - 2, margin + 180, yPosition - 2)
      yPosition += 4

      // Listar todos os contatos
      for (const contact of data.contacts) {
        checkPageBreak(8)

        // Truncar textos longos para caber na página
        const name = (contact.name || "").substring(0, 25)
        const contactInfo = (contact.contact || "").substring(0, 20)
        const source = contact.source || ""
        const status = contact.status || ""
        const value = (contact.value || 0).toFixed(2)

        doc.text(name, margin, yPosition)
        doc.text(contactInfo, margin + 50, yPosition)
        doc.text(source, margin + 90, yPosition)
        doc.text(status, margin + 130, yPosition)
        doc.text(value, margin + 160, yPosition)
        yPosition += 6
      }
    }

    yPosition += 15
  }

  // Seção financeira
  if (includeFinancial) {
    checkPageBreak(40)

    // Título da seção
    doc.setFontSize(16)
    doc.setFont("helvetica", "bold")
    doc.text("Dados Financeiros", margin, yPosition)
    yPosition += 15

    // Resumo financeiro
    doc.setFontSize(12)
    doc.setFont("helvetica", "normal")
    doc.text(`Valor Total: R$ ${data.totalValue.toFixed(2)}`, margin, yPosition)
    yPosition += 8
    doc.text(`Valor Fechado: R$ ${data.financialSummary.fechado.toFixed(2)}`, margin, yPosition)
    yPosition += 8
    doc.text(`Em Negociação: R$ ${data.financialSummary.emNegociacao.toFixed(2)}`, margin, yPosition)
    yPosition += 8
    doc.text(`Perdido: R$ ${data.financialSummary.perdido.toFixed(2)}`, margin, yPosition)
    yPosition += 15

    // Valores por Status
    checkPageBreak(30)
    doc.setFont("helvetica", "bold")
    doc.text("Valores por Status:", margin, yPosition)
    yPosition += 8
    doc.setFont("helvetica", "normal")

    for (const [status, value] of Object.entries(data.financialByStatus)) {
      checkPageBreak()
      doc.text(`${status}: R$ ${(value as number).toFixed(2)}`, margin + 10, yPosition)
      yPosition += 6
    }
    yPosition += 10

    // Valores por Origem
    checkPageBreak(30)
    doc.setFont("helvetica", "bold")
    doc.text("Valores por Origem:", margin, yPosition)
    yPosition += 8
    doc.setFont("helvetica", "normal")

    for (const [source, value] of Object.entries(data.financialBySource)) {
      checkPageBreak()
      doc.text(`${source}: R$ ${(value as number).toFixed(2)}`, margin + 10, yPosition)
      yPosition += 6
    }
  }

  // Rodapé
  const totalPages = doc.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setFontSize(8)
    doc.setFont("helvetica", "normal")
    doc.text(`Página ${i} de ${totalPages}`, doc.internal.pageSize.width - 40, doc.internal.pageSize.height - 10)
  }

  const fileName = generateFileName(options.format, options.period, fromDate, toDate)
  const pdfBuffer = Buffer.from(doc.output("arraybuffer"))

  return {
    fileContent: pdfBuffer,
    contentType: "application/pdf",
    fileName,
  }
}

// Gerar relatório em CSV organizado em colunas A-Z (baseado no PDF)
async function generateCsvReport(
  data: any,
  options: ReportOptions,
  fromDate: Date,
  toDate: Date,
): Promise<ReportResult> {
  const { includeContacts, includeFinancial } = options
  let csvContent = ""

  // BOM para UTF-8 (importante para acentos no Excel)
  csvContent = "\uFEFF"

  // ===========================================
  // CABEÇALHO DO RELATÓRIO
  // ===========================================
  const reportTitle =
    includeContacts && includeFinancial
      ? "Relatório de Contatos e Financeiro"
      : includeContacts
        ? "Relatório de Contatos"
        : "Relatório Financeiro"

  csvContent += `RELATÓRIO,PERÍODO INICIAL,PERÍODO FINAL,DATA GERAÇÃO\n`
  csvContent += `"${reportTitle}","${format(fromDate, "dd/MM/yyyy", { locale: ptBR })}","${format(toDate, "dd/MM/yyyy", { locale: ptBR })}","${format(new Date(), "dd/MM/yyyy HH:mm", { locale: ptBR })}"\n`
  csvContent += `\n`

  // ===========================================
  // LISTA DE CONTATOS (se incluído e existir)
  // ===========================================
  if (includeContacts && data.contacts && data.contacts.length > 0) {
    csvContent += `LISTA DE CONTATOS\n`
    csvContent += `ID,NOME,CONTATO,ORIGEM,STATUS,VALOR\n`

    // Ordenar contatos por data de criação (mais recentes primeiro)
    const sortedContacts = [...data.contacts].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )

    for (const contact of sortedContacts) {
      const id = contact.id || ""
      const name = (contact.name || "").replace(/"/g, '""')
      const contactInfo = (contact.contact || "").replace(/"/g, '""')
      const source = contact.source || ""
      const status = contact.status || ""
      const value = (contact.value || 0).toFixed(2)

      csvContent += `"${id}","${name}","${contactInfo}","${source}","${status}",${value}\n`
    }
    csvContent += `\n`
  }

  // ===========================================
  // DADOS DE CONTATOS (RESUMO)
  // ===========================================
  if (includeContacts) {
    csvContent += `DADOS DE CONTATOS\n`
    csvContent += `MÉTRICA,VALOR\n`
    csvContent += `"Total de contatos no período",${data.contactStats.total}\n`
    csvContent += `\n`

    // Contatos por Status
    csvContent += `CONTATOS POR STATUS\n`
    csvContent += `STATUS,QUANTIDADE\n`
    csvContent += `"Novo",${data.contactStats.byStatus.Novo}\n`
    csvContent += `"Conversando",${data.contactStats.byStatus.Conversando}\n`
    csvContent += `"Interessado",${data.contactStats.byStatus.Interessado}\n`
    csvContent += `"Fechado",${data.contactStats.byStatus.Fechado}\n`
    csvContent += `"Perdido",${data.contactStats.byStatus.Perdido}\n`
    csvContent += `\n`

    // Contatos por Origem
    csvContent += `CONTATOS POR ORIGEM\n`
    csvContent += `ORIGEM,QUANTIDADE\n`
    csvContent += `"WhatsApp",${data.contactStats.bySource.WhatsApp}\n`
    csvContent += `"Instagram",${data.contactStats.bySource.Instagram}\n`
    csvContent += `"Outro",${data.contactStats.bySource.Outro}\n`
    csvContent += `\n`
  }

  // ===========================================
  // DADOS FINANCEIROS
  // ===========================================
  if (includeFinancial) {
    csvContent += `DADOS FINANCEIROS\n`
    csvContent += `MÉTRICA,VALOR\n`
    csvContent += `"Valor Total",${data.totalValue.toFixed(2)}\n`
    csvContent += `"Valor Fechado",${data.financialSummary.fechado.toFixed(2)}\n`
    csvContent += `"Em Negociação",${data.financialSummary.emNegociacao.toFixed(2)}\n`
    csvContent += `"Perdido",${data.financialSummary.perdido.toFixed(2)}\n`
    csvContent += `\n`

    // Valores por Status
    csvContent += `VALORES POR STATUS\n`
    csvContent += `STATUS,VALOR\n`
    csvContent += `"Novo",${data.financialByStatus.Novo.toFixed(2)}\n`
    csvContent += `"Conversando",${data.financialByStatus.Conversando.toFixed(2)}\n`
    csvContent += `"Interessado",${data.financialByStatus.Interessado.toFixed(2)}\n`
    csvContent += `"Fechado",${data.financialByStatus.Fechado.toFixed(2)}\n`
    csvContent += `"Perdido",${data.financialByStatus.Perdido.toFixed(2)}\n`
    csvContent += `\n`

    // Valores por Origem
    csvContent += `VALORES POR ORIGEM\n`
    csvContent += `ORIGEM,VALOR\n`
    csvContent += `"WhatsApp",${data.financialBySource.WhatsApp.toFixed(2)}\n`
    csvContent += `"Instagram",${data.financialBySource.Instagram.toFixed(2)}\n`
    csvContent += `"Outro",${data.financialBySource.Outro.toFixed(2)}\n`
  }

  const fileName = generateFileName(options.format, options.period, fromDate, toDate)

  return {
    fileContent: csvContent,
    contentType: "text/csv;charset=utf-8",
    fileName,
  }
}

// Funções auxiliares para buscar dados

// Contagem de contatos por status
async function getContactCountByStatus(userId: string, fromDate: Date, toDate: Date) {
  const counts = await prisma.contact.groupBy({
    by: ["status"],
    where: {
      userId,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    _count: {
      status: true,
    },
  })

  // Inicializar com zeros
  const result: Record<string, number> = {
    Novo: 0,
    Conversando: 0,
    Interessado: 0,
    Fechado: 0,
    Perdido: 0,
  }

  // Preencher com resultados reais
  counts.forEach((count) => {
    result[count.status] = count._count.status
  })

  return result
}

// Contagem de contatos por origem
async function getContactCountBySource(userId: string, fromDate: Date, toDate: Date) {
  const counts = await prisma.contact.groupBy({
    by: ["source"],
    where: {
      userId,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    _count: {
      source: true,
    },
  })

  // Inicializar com zeros
  const result: Record<string, number> = {
    WhatsApp: 0,
    Instagram: 0,
    Outro: 0,
  }

  // Preencher com resultados reais
  counts.forEach((count) => {
    result[count.source] = count._count.source
  })

  return result
}

// Dados financeiros por status
async function getFinancialDataByStatus(userId: string, fromDate: Date, toDate: Date) {
  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      status: true,
      value: true,
    },
  })

  // Inicializar com zeros
  const result: Record<string, number> = {
    Novo: 0,
    Conversando: 0,
    Interessado: 0,
    Fechado: 0,
    Perdido: 0,
  }

  // Somar valores por status
  contacts.forEach((contact) => {
    result[contact.status] += contact.value || 0
  })

  return result
}

// Dados financeiros por origem
async function getFinancialDataBySource(userId: string, fromDate: Date, toDate: Date) {
  const contacts = await prisma.contact.findMany({
    where: {
      userId,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    select: {
      source: true,
      value: true,
    },
  })

  // Inicializar com zeros
  const result: Record<string, number> = {
    WhatsApp: 0,
    Instagram: 0,
    Outro: 0,
  }

  // Somar valores por origem
  contacts.forEach((contact) => {
    result[contact.source] += contact.value || 0
  })

  return result
}

// Valor financeiro total
async function getTotalFinancialValue(userId: string, fromDate: Date, toDate: Date) {
  const result = await prisma.contact.aggregate({
    where: {
      userId,
      createdAt: {
        gte: fromDate,
        lte: toDate,
      },
    },
    _sum: {
      value: true,
    },
  })

  return result._sum.value || 0
}
