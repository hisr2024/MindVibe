/**
 * Chart Component
 * Wrapper component for Recharts with theme support
 */

'use client'

import React, { useMemo } from 'react'
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  type TooltipProps,
} from 'recharts'
import type { ChartTheme } from '@/types/analytics.types'
import { DARK_CHART_THEME } from '@/types/analytics.types'

type ChartType = 'line' | 'area' | 'bar' | 'pie'

interface ChartDataPoint {
  [key: string]: string | number
}

interface ChartProps {
  type: ChartType
  data: ChartDataPoint[]
  dataKey: string
  xAxisKey?: string
  height?: number
  showGrid?: boolean
  showLegend?: boolean
  showTooltip?: boolean
  colors?: string[]
  gradientId?: string
  animate?: boolean
  className?: string
  tooltipFormatter?: (value: number) => string
  labelFormatter?: (label: string) => string
}

// Custom tooltip component
function CustomTooltip({
  active,
  payload,
  label,
  formatter,
  labelFormatter,
}: TooltipProps<number, string> & {
  formatter?: (value: number) => string
  labelFormatter?: (label: string) => string
}) {
  if (!active || !payload || !payload.length) return null

  return (
    <div
      className="rounded-lg border border-[#d4a44c]/20 bg-[#0d0d10]/95 px-3 py-2 text-[#f5f0e8] shadow-lg"
    >
      <p className="text-xs font-medium mb-1">
        {labelFormatter ? labelFormatter(label as string) : label}
      </p>
      {payload.map((entry, index) => (
        <p
          key={index}
          className="text-sm font-bold"
          style={{ color: entry.color }}
        >
          {formatter ? formatter(entry.value as number) : entry.value}
        </p>
      ))}
    </div>
  )
}

export function Chart({
  type,
  data,
  dataKey,
  xAxisKey = 'date',
  height = 300,
  showGrid = true,
  showLegend = false,
  showTooltip = true,
  colors,
  gradientId,
  animate = true,
  className = '',
  tooltipFormatter,
  labelFormatter,
}: ChartProps) {
  const theme: ChartTheme = DARK_CHART_THEME

  const chartColors = useMemo(
    () =>
      colors || [
        theme.primaryColor,
        theme.secondaryColor,
        theme.accentColor,
        theme.positiveColor,
        theme.negativeColor,
      ],
    [colors, theme]
  )

  const gradientIdFinal = gradientId || `gradient-${dataKey}`

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={theme.textColor}
              tick={{ fill: theme.textColor, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.gridColor }}
            />
            <YAxis
              stroke={theme.textColor}
              tick={{ fill: theme.textColor, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.gridColor }}
            />
            {showTooltip && (
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={tooltipFormatter}
                    labelFormatter={labelFormatter}
                  />
                }
              />
            )}
            {showLegend && <Legend />}
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke={chartColors[0]}
              strokeWidth={2}
              dot={{ fill: chartColors[0], r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={animate}
            />
          </LineChart>
        )

      case 'area':
        return (
          <AreaChart data={data}>
            <defs>
              <linearGradient id={gradientIdFinal} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={chartColors[0]} stopOpacity={0.3} />
                <stop offset="95%" stopColor={chartColors[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={theme.textColor}
              tick={{ fill: theme.textColor, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.gridColor }}
            />
            <YAxis
              stroke={theme.textColor}
              tick={{ fill: theme.textColor, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.gridColor }}
            />
            {showTooltip && (
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={tooltipFormatter}
                    labelFormatter={labelFormatter}
                  />
                }
              />
            )}
            {showLegend && <Legend />}
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke={chartColors[0]}
              strokeWidth={2}
              fill={`url(#${gradientIdFinal})`}
              isAnimationActive={animate}
            />
          </AreaChart>
        )

      case 'bar':
        return (
          <BarChart data={data}>
            {showGrid && (
              <CartesianGrid strokeDasharray="3 3" stroke={theme.gridColor} />
            )}
            <XAxis
              dataKey={xAxisKey}
              stroke={theme.textColor}
              tick={{ fill: theme.textColor, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.gridColor }}
            />
            <YAxis
              stroke={theme.textColor}
              tick={{ fill: theme.textColor, fontSize: 12 }}
              tickLine={false}
              axisLine={{ stroke: theme.gridColor }}
            />
            {showTooltip && (
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={tooltipFormatter}
                    labelFormatter={labelFormatter}
                  />
                }
              />
            )}
            {showLegend && <Legend />}
            <Bar
              dataKey={dataKey}
              fill={chartColors[0]}
              radius={[4, 4, 0, 0]}
              isAnimationActive={animate}
            />
          </BarChart>
        )

      case 'pie':
        return (
          <PieChart>
            {showTooltip && (
              <Tooltip
                content={
                  <CustomTooltip
                    formatter={tooltipFormatter}
                    labelFormatter={labelFormatter}
                  />
                }
              />
            )}
            {showLegend && <Legend />}
            <Pie
              data={data}
              dataKey={dataKey}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              innerRadius={40}
              paddingAngle={2}
              isAnimationActive={animate}
            >
              {data.map((_, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={chartColors[index % chartColors.length]}
                />
              ))}
            </Pie>
          </PieChart>
        )

      default:
        return null
    }
  }

  return (
    <div className={`w-full ${className}`} style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        {renderChart() as React.ReactElement}
      </ResponsiveContainer>
    </div>
  )
}

export default Chart
