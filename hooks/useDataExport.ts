/**
 * useDataExport Hook
 * Handle data export in multiple formats
 */

'use client'

import { useState, useCallback } from 'react'
import type {
  ExportFormat,
  ExportDataType,
  DateRange,
  ExportProgress,
  AnalyticsData,
} from '@/types/analytics.types'
import {
  exportAnalyticsData,
  validateDateRange,
  getDefaultDateRange,
} from '@/utils/exportHelpers'

interface ExportState {
  isExporting: boolean
  progress: ExportProgress | null
  error: string | null
}

interface UseDataExportResult {
  // State
  isExporting: boolean
  progress: ExportProgress | null
  error: string | null

  // Export functions
  exportData: (
    analyticsData: AnalyticsData,
    format: ExportFormat,
    dataTypes: ExportDataType[],
    dateRange?: DateRange
  ) => Promise<void>

  // Quick export functions
  exportToCSV: (analyticsData: AnalyticsData, dataTypes?: ExportDataType[]) => Promise<void>
  exportToJSON: (analyticsData: AnalyticsData, dataTypes?: ExportDataType[]) => Promise<void>
  exportToPDF: (analyticsData: AnalyticsData) => Promise<void>

  // Helpers
  resetState: () => void
  validateRange: (dateRange: DateRange) => boolean
  getDefaultRange: () => DateRange
}

export function useDataExport(): UseDataExportResult {
  const [state, setState] = useState<ExportState>({
    isExporting: false,
    progress: null,
    error: null,
  })

  // Main export function
  const exportData = useCallback(
    async (
      analyticsData: AnalyticsData,
      format: ExportFormat,
      dataTypes: ExportDataType[],
      dateRange?: DateRange
    ) => {
      // Validate date range if provided
      if (dateRange && !validateDateRange(dateRange)) {
        setState({
          isExporting: false,
          progress: null,
          error: 'Invalid date range',
        })
        return
      }

      setState({
        isExporting: true,
        progress: { status: 'processing', progress: 0 },
        error: null,
      })

      try {
        // Update progress
        setState((prev) => ({
          ...prev,
          progress: { status: 'processing', progress: 30 },
        }))

        await exportAnalyticsData(analyticsData, format, dataTypes, dateRange)

        setState({
          isExporting: false,
          progress: { status: 'completed', progress: 100 },
          error: null,
        })
      } catch (error) {
        setState({
          isExporting: false,
          progress: {
            status: 'failed',
            progress: 0,
            error: error instanceof Error ? error.message : 'Export failed',
          },
          error: error instanceof Error ? error.message : 'Export failed',
        })
      }
    },
    []
  )

  // Quick export to CSV
  const exportToCSV = useCallback(
    async (analyticsData: AnalyticsData, dataTypes: ExportDataType[] = ['all']) => {
      await exportData(analyticsData, 'csv', dataTypes, getDefaultDateRange())
    },
    [exportData]
  )

  // Quick export to JSON
  const exportToJSON = useCallback(
    async (analyticsData: AnalyticsData, dataTypes: ExportDataType[] = ['all']) => {
      await exportData(analyticsData, 'json', dataTypes, getDefaultDateRange())
    },
    [exportData]
  )

  // Quick export to PDF
  const exportToPDF = useCallback(
    async (analyticsData: AnalyticsData) => {
      await exportData(analyticsData, 'pdf', ['all'], getDefaultDateRange())
    },
    [exportData]
  )

  // Reset state
  const resetState = useCallback(() => {
    setState({
      isExporting: false,
      progress: null,
      error: null,
    })
  }, [])

  return {
    isExporting: state.isExporting,
    progress: state.progress,
    error: state.error,
    exportData,
    exportToCSV,
    exportToJSON,
    exportToPDF,
    resetState,
    validateRange: validateDateRange,
    getDefaultRange: getDefaultDateRange,
  }
}

export default useDataExport
