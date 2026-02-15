/**
 * DataExport Component
 * Export data in multiple formats with date range selection
 */

'use client'

import { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button, Input } from '@/components/ui'
import { LoadingSpinner } from '@/components/common/LoadingSpinner'
import type { ExportFormat, ExportDataType, DateRange, AnalyticsData } from '@/types/analytics.types'
import { useDataExport } from '@/hooks/useDataExport'

interface DataExportProps {
  analyticsData: AnalyticsData | null
  className?: string
}

const formatOptions: { value: ExportFormat; label: string; icon: string; description: string }[] = [
  {
    value: 'csv',
    label: 'CSV',
    icon: '📊',
    description: 'Spreadsheet compatible',
  },
  {
    value: 'json',
    label: 'JSON',
    icon: '🔧',
    description: 'Developer friendly',
  },
  {
    value: 'pdf',
    label: 'PDF',
    icon: '📄',
    description: 'Print ready report',
  },
]

const dataTypeOptions: { value: ExportDataType; label: string; icon: string }[] = [
  { value: 'all', label: 'All Data', icon: '📦' },
  { value: 'journal', label: 'Journal', icon: '📝' },
  { value: 'mood', label: 'Mood', icon: '😊' },
  { value: 'kiaan', label: 'KIAAN', icon: '💬' },
]

export function DataExport({ analyticsData, className = '' }: DataExportProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('csv')
  const [selectedDataTypes, setSelectedDataTypes] = useState<ExportDataType[]>(['all'])
  const defaultDateRange = useMemo<DateRange>(() => {
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now()
    return {
      start: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      end: new Date(now).toISOString().split('T')[0],
    }
  }, [])
  const [dateRange, setDateRange] = useState<DateRange>(defaultDateRange)

  const { isExporting, progress, error, exportData, resetState } = useDataExport()

  const toggleDataType = (dataType: ExportDataType) => {
    if (dataType === 'all') {
      setSelectedDataTypes(['all'])
    } else {
      const newTypes = selectedDataTypes.filter((t) => t !== 'all')
      if (newTypes.includes(dataType)) {
        setSelectedDataTypes(newTypes.filter((t) => t !== dataType))
      } else {
        setSelectedDataTypes([...newTypes, dataType])
      }
    }
  }

  const handleExport = async () => {
    if (!analyticsData) return
    
    // Validate date range
    const startDate = new Date(dateRange.start)
    const endDate = new Date(dateRange.end)
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      resetState()
      return
    }
    
    if (startDate > endDate) {
      resetState()
      return
    }
    
    await exportData(
      analyticsData,
      selectedFormat,
      selectedDataTypes.length === 0 ? ['all'] : selectedDataTypes,
      dateRange
    )
  }

  const handleClose = () => {
    setIsOpen(false)
    resetState()
  }

  return (
    <div className={className}>
      {/* Export Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        disabled={!analyticsData}
        leftIcon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-4 h-4"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
        }
      >
        Export Data
      </Button>

      {/* Export Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border border-orange-500/20 bg-[#0d0d10] p-6 shadow-2xl"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-orange-50">
                  Export Your Data
                </h2>
                <button
                  onClick={handleClose}
                  className="text-orange-100/60 hover:text-orange-50 transition"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="w-5 h-5"
                  >
                    <line x1="18" y1="6" x2="6" y2="18" />
                    <line x1="6" y1="6" x2="18" y2="18" />
                  </svg>
                </button>
              </div>

              {/* Format Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-orange-100/80 mb-3">
                  Export Format
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {formatOptions.map((format) => (
                    <button
                      key={format.value}
                      onClick={() => setSelectedFormat(format.value)}
                      className={`flex flex-col items-center gap-1 p-3 rounded-xl border transition ${
                        selectedFormat === format.value
                          ? 'border-orange-400 bg-orange-500/10'
                          : 'border-orange-500/20 bg-black/30 hover:border-orange-400/50'
                      }`}
                    >
                      <span className="text-xl">{format.icon}</span>
                      <span className="text-sm font-medium text-orange-50">
                        {format.label}
                      </span>
                      <span className="text-[10px] text-orange-100/50">
                        {format.description}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Data Type Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-orange-100/80 mb-3">
                  Data to Export
                </label>
                <div className="flex flex-wrap gap-2">
                  {dataTypeOptions.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => toggleDataType(type.value)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition ${
                        selectedDataTypes.includes(type.value)
                          ? 'border-orange-400 bg-orange-500/10'
                          : 'border-orange-500/20 bg-black/30 hover:border-orange-400/50'
                      }`}
                    >
                      <span>{type.icon}</span>
                      <span className="text-sm text-orange-50">{type.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date Range */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-orange-100/80 mb-3">
                  Date Range
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-orange-100/50 mb-1">
                      From
                    </label>
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, start: e.target.value }))
                      }
                      className="w-full rounded-lg border border-orange-500/20 bg-black/50 px-3 py-2 text-sm text-orange-50 outline-none focus:border-orange-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-orange-100/50 mb-1">
                      To
                    </label>
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) =>
                        setDateRange((prev) => ({ ...prev, end: e.target.value }))
                      }
                      className="w-full rounded-lg border border-orange-500/20 bg-black/50 px-3 py-2 text-sm text-orange-50 outline-none focus:border-orange-400"
                    />
                  </div>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 p-3">
                  <p className="text-sm text-red-400">{error}</p>
                </div>
              )}

              {/* Progress */}
              {isExporting && progress && (
                <div className="mb-4">
                  <div className="flex items-center justify-between text-sm text-orange-100/60 mb-2">
                    <span>Exporting...</span>
                    <span>{progress.progress}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-orange-500/20 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress.progress}%` }}
                      className="h-full bg-gradient-to-r from-orange-400 to-amber-300"
                    />
                  </div>
                </div>
              )}

              {/* Success Message */}
              {progress?.status === 'completed' && (
                <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3">
                  <p className="text-sm text-emerald-400">
                    ✅ Export complete! Your download should start automatically.
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleExport}
                  disabled={isExporting || !analyticsData}
                  loading={isExporting}
                  className="flex-1"
                >
                  {isExporting ? 'Exporting...' : 'Export'}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

export default DataExport
