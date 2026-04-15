/**
 * app/api/privacy/pdf/route.ts
 *
 * GET /api/privacy/pdf → streams the Privacy Policy as a printable PDF.
 *
 * Implementation notes:
 *   - Uses the project-native `jspdf` dependency (already shipped) so no new
 *     runtime packages are pulled.
 *   - Generation is synchronous and deterministic; the same MDX source always
 *     yields the same PDF for the same `version` query param.
 *   - Runs at the edge-compatible Node runtime because jspdf needs DOM-like
 *     primitives we polyfill via ArrayBuffer output.
 *   - Sets `Cache-Control: public, max-age=3600, s-maxage=86400` so the CDN
 *     can serve it; users get a fresh copy whenever we cut a new version.
 *
 * Security:
 *   - Read-only endpoint; no user input is ever logged or echoed beyond the
 *     version string which is validated against /^[\d.]{1,12}$/.
 *   - No authentication required — privacy policy is public information.
 */

import { NextResponse } from 'next/server'
import { jsPDF } from 'jspdf'
import {
  formatLastUpdated,
  getPrivacyDocument,
  type ContentBlock,
  type InlineNode,
} from '@/lib/mdx/privacy'

export const runtime = 'nodejs'
export const dynamic = 'force-static'
export const revalidate = 86400

const SAFE_VERSION_RE = /^[\d.]{1,12}$/

function flattenInline(nodes: InlineNode[]): string {
  return nodes
    .map((node) => {
      switch (node.type) {
        case 'link':
          return `${node.value} (${node.href})`
        default:
          return node.value
      }
    })
    .join('')
}

function renderBlock(
  doc: jsPDF,
  block: ContentBlock,
  cursor: { y: number },
  margins: { left: number; right: number; top: number; bottom: number },
  pageHeight: number,
  pageWidth: number,
): void {
  const ensureSpace = (needed: number) => {
    if (cursor.y + needed > pageHeight - margins.bottom) {
      doc.addPage()
      cursor.y = margins.top
    }
  }

  const contentWidth = pageWidth - margins.left - margins.right

  switch (block.type) {
    case 'h3': {
      ensureSpace(24)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(12)
      doc.setTextColor(40, 40, 40)
      const lines = doc.splitTextToSize(block.text, contentWidth)
      doc.text(lines, margins.left, cursor.y)
      cursor.y += lines.length * 14 + 4
      break
    }
    case 'paragraph': {
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10.5)
      doc.setTextColor(55, 55, 55)
      const text = flattenInline(block.children)
      const lines = doc.splitTextToSize(text, contentWidth)
      for (const line of lines) {
        ensureSpace(14)
        doc.text(line, margins.left, cursor.y)
        cursor.y += 14
      }
      cursor.y += 6
      break
    }
    case 'table': {
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(9.5)
      const colCount = block.headers.length
      const colWidth = contentWidth / colCount
      ensureSpace(22)
      block.headers.forEach((header, idx) => {
        doc.text(header, margins.left + idx * colWidth, cursor.y)
      })
      cursor.y += 14
      doc.setDrawColor(200, 168, 75)
      doc.line(margins.left, cursor.y - 8, pageWidth - margins.right, cursor.y - 8)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      for (const row of block.rows) {
        let rowHeight = 0
        const cellLines = row.map((cell, idx) => {
          const wrapped = doc.splitTextToSize(cell, colWidth - 6)
          rowHeight = Math.max(rowHeight, wrapped.length * 12)
          return { text: wrapped, x: margins.left + idx * colWidth }
        })
        ensureSpace(rowHeight + 6)
        cellLines.forEach((cell) => {
          doc.text(cell.text, cell.x, cursor.y)
        })
        cursor.y += rowHeight + 6
      }
      cursor.y += 4
      break
    }
    default: {
      const _exhaustive: never = block
      void _exhaustive
    }
  }
}

function buildPdf(): ArrayBuffer {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' })
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  const margins = { left: 54, right: 54, top: 64, bottom: 64 }
  const cursor = { y: margins.top }

  const { frontmatter, sections } = getPrivacyDocument()

  // Title block
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(22)
  doc.setTextColor(20, 20, 20)
  doc.text(frontmatter.title, margins.left, cursor.y)
  cursor.y += 28

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(120, 120, 120)
  doc.text(
    `Version ${frontmatter.version} · Last updated ${formatLastUpdated(
      frontmatter.lastUpdated,
    )}`,
    margins.left,
    cursor.y,
  )
  cursor.y += 16
  doc.text(
    `Compliance: ${frontmatter.compliance.join(' · ')}`,
    margins.left,
    cursor.y,
  )
  cursor.y += 24

  // Divider
  doc.setDrawColor(200, 168, 75)
  doc.line(margins.left, cursor.y, pageWidth - margins.right, cursor.y)
  cursor.y += 22

  // Sections
  for (const section of sections) {
    if (cursor.y + 48 > pageHeight - margins.bottom) {
      doc.addPage()
      cursor.y = margins.top
    }
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(15)
    doc.setTextColor(20, 20, 20)
    const label = section.ordinal
      ? `${section.ordinal}. ${section.heading}`
      : section.heading
    const headingLines = doc.splitTextToSize(
      label,
      pageWidth - margins.left - margins.right,
    )
    doc.text(headingLines, margins.left, cursor.y)
    cursor.y += headingLines.length * 18 + 8

    for (const block of section.blocks) {
      renderBlock(doc, block, cursor, margins, pageHeight, pageWidth)
    }
    cursor.y += 8
  }

  // Footer on every page
  const total = doc.getNumberOfPages()
  for (let page = 1; page <= total; page += 1) {
    doc.setPage(page)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(150, 150, 150)
    doc.text(
      `Sakha Privacy Policy v${frontmatter.version}  ·  Page ${page} of ${total}`,
      margins.left,
      pageHeight - 32,
    )
    doc.text(frontmatter.contact.email, pageWidth - margins.right, pageHeight - 32, {
      align: 'right',
    })
  }

  return doc.output('arraybuffer')
}

export function GET(request: Request): Response {
  const url = new URL(request.url)
  const rawVersion = url.searchParams.get('version') ?? ''
  const version = SAFE_VERSION_RE.test(rawVersion) ? rawVersion : ''

  try {
    const buffer = buildPdf()
    const filename = `sakha-privacy-policy${version ? `-${version}` : ''}.pdf`
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': String(buffer.byteLength),
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'unknown error'
    return NextResponse.json(
      { error: 'pdf_generation_failed', message },
      { status: 500 },
    )
  }
}
