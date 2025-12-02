/**
 * Export Helpers
 * Utility functions for data export functionality
 */

import type {
  ExportFormat,
  ExportDataType,
  DateRange,
  AnalyticsData,
  JournalStatistics,
  MoodTrendData,
  KIAANInsightData,
} from '@/types/analytics.types'

/**
 * Generate filename for export
 */
export function generateExportFilename(
  format: ExportFormat,
  dataTypes: ExportDataType[],
  dateRange?: DateRange
): string {
  const timestamp = new Date().toISOString().split('T')[0]
  const typeStr = dataTypes.length === 1 ? dataTypes[0] : 'data'
  const dateStr = dateRange
    ? `_${dateRange.start}_to_${dateRange.end}`
    : ''

  return `mindvibe_${typeStr}${dateStr}_${timestamp}.${format}`
}

/**
 * Convert analytics data to CSV format
 */
export function convertToCSV(
  data: Record<string, unknown>[],
  headers?: string[]
): string {
  if (data.length === 0) return ''

  const keys = headers || Object.keys(data[0])
  const headerRow = keys.join(',')

  const rows = data.map((row) =>
    keys
      .map((key) => {
        const value = row[key]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return String(value)
      })
      .join(',')
  )

  return [headerRow, ...rows].join('\n')
}

/**
 * Format mood data for CSV export
 */
export function formatMoodDataForCSV(
  moodData: MoodTrendData
): Record<string, unknown>[] {
  return moodData.data.map((point) => ({
    Date: point.date,
    Score: point.score.toFixed(1),
    Mood: point.label || '',
    Notes: point.notes || '',
  }))
}

/**
 * Format journal statistics for CSV export
 */
export function formatJournalStatsForCSV(
  stats: JournalStatistics
): Record<string, unknown>[] {
  const summary = [
    { Metric: 'Total Entries', Value: stats.totalEntries },
    { Metric: 'Total Words', Value: stats.totalWords },
    { Metric: 'Average Words per Entry', Value: stats.avgWordsPerEntry },
    { Metric: 'Current Streak', Value: stats.currentStreak },
    { Metric: 'Longest Streak', Value: stats.longestStreak },
    { Metric: 'Average Entries per Week', Value: stats.avgEntriesPerWeek.toFixed(1) },
  ]

  return summary
}

/**
 * Format KIAAN insights for CSV export
 */
export function formatKIAANInsightsForCSV(
  insights: KIAANInsightData
): Record<string, unknown>[] {
  const summary = [
    { Metric: 'Total Conversations', Value: insights.totalConversations },
    { Metric: 'Total Messages', Value: insights.totalMessages },
    { Metric: 'Average Messages per Conversation', Value: insights.avgMessagesPerConversation.toFixed(1) },
    { Metric: 'Average Response Time (s)', Value: insights.avgResponseTime.toFixed(1) },
    { Metric: 'Engagement Level', Value: insights.engagementLevel },
    { Metric: 'Streak Days', Value: insights.streakDays },
  ]

  return summary
}

/**
 * Convert data to JSON string with formatting
 */
export function convertToJSON(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

/**
 * Create downloadable blob from content
 */
export function createDownloadBlob(
  content: string,
  type: 'csv' | 'json' | 'pdf'
): Blob {
  const mimeTypes = {
    csv: 'text/csv;charset=utf-8;',
    json: 'application/json;charset=utf-8;',
    pdf: 'application/pdf',
  }

  return new Blob([content], { type: mimeTypes[type] })
}

/**
 * Trigger file download
 */
export function downloadFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export data to CSV
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  filename: string
): void {
  const csv = convertToCSV(data)
  const blob = createDownloadBlob(csv, 'csv')
  downloadFile(blob, filename)
}

/**
 * Export data to JSON
 */
export function exportToJSON(data: unknown, filename: string): void {
  const json = convertToJSON(data)
  const blob = createDownloadBlob(json, 'json')
  downloadFile(blob, filename)
}

/**
 * Generate PDF export (basic implementation)
 * Note: Full PDF generation requires jspdf library
 */
export async function exportToPDF(
  data: AnalyticsData,
  filename: string
): Promise<void> {
  // Dynamic import to reduce bundle size
  const { jsPDF } = await import('jspdf')

  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  let yPos = 20

  // Title
  doc.setFontSize(20)
  doc.setTextColor(255, 115, 39) // Orange
  doc.text('MindVibe Analytics Report', pageWidth / 2, yPos, { align: 'center' })
  yPos += 15

  // Date
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(
    `Generated on ${new Date().toLocaleDateString()}`,
    pageWidth / 2,
    yPos,
    { align: 'center' }
  )
  yPos += 20

  // Overview Section
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Overview', 20, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setTextColor(60)
  const overviewItems = [
    `Total Journal Entries: ${data.overview.totalEntries}`,
    `Total Words Written: ${data.overview.totalWords}`,
    `Average Mood Score: ${data.overview.avgMoodScore.toFixed(1)}/10`,
    `Current Streak: ${data.overview.currentStreak} days`,
    `KIAAN Conversations: ${data.overview.kiaanConversations}`,
  ]

  overviewItems.forEach((item) => {
    doc.text(item, 25, yPos)
    yPos += 7
  })

  yPos += 10

  // Journal Statistics Section
  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('Journal Statistics', 20, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setTextColor(60)
  const journalItems = [
    `Average Words per Entry: ${data.journalStats.avgWordsPerEntry}`,
    `Longest Streak: ${data.journalStats.longestStreak} days`,
    `Avg Entries per Week: ${data.journalStats.avgEntriesPerWeek.toFixed(1)}`,
  ]

  journalItems.forEach((item) => {
    doc.text(item, 25, yPos)
    yPos += 7
  })

  yPos += 10

  // Sentiment Distribution
  doc.setFontSize(12)
  doc.setTextColor(0)
  doc.text('Sentiment Distribution:', 25, yPos)
  yPos += 7

  doc.setFontSize(10)
  doc.setTextColor(60)
  const sentimentItems = [
    `Positive: ${data.journalStats.sentimentDistribution.positive}%`,
    `Neutral: ${data.journalStats.sentimentDistribution.neutral}%`,
    `Negative: ${data.journalStats.sentimentDistribution.negative}%`,
  ]

  sentimentItems.forEach((item) => {
    doc.text(item, 30, yPos)
    yPos += 7
  })

  yPos += 10

  // KIAAN Insights Section
  if (yPos > 250) {
    doc.addPage()
    yPos = 20
  }

  doc.setFontSize(14)
  doc.setTextColor(0)
  doc.text('KIAAN Insights', 20, yPos)
  yPos += 10

  doc.setFontSize(10)
  doc.setTextColor(60)
  const kiaanItems = [
    `Total Conversations: ${data.kiaanInsights.totalConversations}`,
    `Total Messages: ${data.kiaanInsights.totalMessages}`,
    `Engagement Level: ${data.kiaanInsights.engagementLevel}`,
  ]

  kiaanItems.forEach((item) => {
    doc.text(item, 25, yPos)
    yPos += 7
  })

  // Save PDF
  doc.save(filename)
}

/**
 * Combined export function
 */
export async function exportAnalyticsData(
  data: AnalyticsData,
  format: ExportFormat,
  dataTypes: ExportDataType[],
  dateRange?: DateRange
): Promise<void> {
  const filename = generateExportFilename(format, dataTypes, dateRange)

  switch (format) {
    case 'csv': {
      let csvData: Record<string, unknown>[] = []

      if (dataTypes.includes('mood') || dataTypes.includes('all')) {
        csvData = [...csvData, ...formatMoodDataForCSV(data.moodTrends)]
      }
      if (dataTypes.includes('journal') || dataTypes.includes('all')) {
        csvData = [...csvData, ...formatJournalStatsForCSV(data.journalStats)]
      }
      if (dataTypes.includes('kiaan') || dataTypes.includes('all')) {
        csvData = [...csvData, ...formatKIAANInsightsForCSV(data.kiaanInsights)]
      }

      exportToCSV(csvData, filename)
      break
    }

    case 'json': {
      const jsonData: Record<string, unknown> = {}

      if (dataTypes.includes('mood') || dataTypes.includes('all')) {
        jsonData.moodTrends = data.moodTrends
      }
      if (dataTypes.includes('journal') || dataTypes.includes('all')) {
        jsonData.journalStats = data.journalStats
      }
      if (dataTypes.includes('kiaan') || dataTypes.includes('all')) {
        jsonData.kiaanInsights = data.kiaanInsights
      }

      jsonData.exportedAt = new Date().toISOString()
      jsonData.dateRange = dateRange

      exportToJSON(jsonData, filename)
      break
    }

    case 'pdf':
      await exportToPDF(data, filename)
      break
  }
}

/**
 * Parse CSV string to data array
 */
export function parseCSV(csvString: string): Record<string, string>[] {
  const lines = csvString.trim().split('\n')
  if (lines.length === 0) return []

  const headers = lines[0].split(',').map((h) => h.trim())
  const data: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',')
    const row: Record<string, string> = {}

    headers.forEach((header, index) => {
      row[header] = values[index]?.trim() || ''
    })

    data.push(row)
  }

  return data
}

/**
 * Validate date range for export
 */
export function validateDateRange(dateRange: DateRange): boolean {
  const start = new Date(dateRange.start)
  const end = new Date(dateRange.end)

  return !isNaN(start.getTime()) && !isNaN(end.getTime()) && start <= end
}

/**
 * Get default date range (last 30 days)
 */
export function getDefaultDateRange(): DateRange {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 30)

  return {
    start: start.toISOString().split('T')[0],
    end: end.toISOString().split('T')[0],
  }
}
