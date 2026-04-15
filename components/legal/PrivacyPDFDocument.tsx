/**
 * components/legal/PrivacyPDFDocument.tsx
 *
 * React-PDF document for the Privacy Policy.
 *
 * This is a server-only module — it imports `@react-pdf/renderer` which
 * requires the Node.js runtime (not the Vercel Edge runtime). It is rendered
 * to a Node readable stream inside app/api/privacy/pdf/route.ts.
 *
 * Structure:
 *   - Cover page   → Kiaanverse wordmark + "Privacy Policy" + effective date.
 *   - TOC page     → Numbered entries; page numbers rendered post-layout using
 *                    react-pdf's Text render prop with pageNumber.
 *   - Content      → One section per top-level heading, starting on a new
 *                    logical block (not a forced page break, for tight print).
 *   - Fixed footer → Kiaanverse wordmark, contact, page number — on every page.
 *
 * Design:
 *   - White background, dark text — explicitly print-optimised, NOT dark theme.
 *   - Serif headings (Times-Bold), sans body (Helvetica).
 *   - Gold accent rule under page titles matches the web brand.
 *   - A4 page size, generous 56pt side margins for binder-friendly margins.
 */

import { ReactElement } from 'react'
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from '@react-pdf/renderer'
import type {
  ContentBlock,
  InlineNode,
  PrivacyDocument,
  PrivacySection,
  TableBlock,
} from '@/lib/mdx/privacy'
import { formatLastUpdated } from '@/lib/mdx/privacy'

// ---------------------------------------------------------------------------
// Brand tokens — print-tuned values. Never reference dark-theme tokens here:
// the PDF is for physical printing and must remain high-contrast on paper.
// ---------------------------------------------------------------------------

const BRAND = {
  gold: '#A8872E',       // darker than UI gold for WCAG AAA print contrast
  goldSoft: '#D9B74A',
  ink: '#111111',
  body: '#2F2F2F',
  muted: '#6B6B6B',
  rule: '#D8D3C4',
  paper: '#FFFFFF',
} as const

const styles = StyleSheet.create({
  // -------- Page shells --------
  page: {
    paddingTop: 64,
    paddingBottom: 72,
    paddingHorizontal: 56,
    backgroundColor: BRAND.paper,
    color: BRAND.body,
    fontFamily: 'Helvetica',
    fontSize: 10.5,
    lineHeight: 1.55,
  },
  coverPage: {
    paddingTop: 0,
    paddingBottom: 0,
    paddingHorizontal: 0,
    backgroundColor: BRAND.paper,
    fontFamily: 'Helvetica',
  },
  // -------- Cover --------
  coverHero: {
    flexGrow: 1,
    paddingHorizontal: 72,
    paddingTop: 140,
    paddingBottom: 72,
    borderTopWidth: 6,
    borderTopColor: BRAND.gold,
  },
  coverWordmark: {
    fontFamily: 'Times-Bold',
    fontSize: 28,
    letterSpacing: 3,
    color: BRAND.ink,
    marginBottom: 12,
  },
  coverTagline: {
    fontSize: 11,
    letterSpacing: 2,
    color: BRAND.muted,
    textTransform: 'uppercase',
    marginBottom: 96,
  },
  coverTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 52,
    lineHeight: 1.1,
    color: BRAND.ink,
    marginBottom: 24,
  },
  coverSubtitle: {
    fontSize: 13,
    lineHeight: 1.55,
    color: BRAND.body,
    maxWidth: 420,
    marginBottom: 48,
  },
  coverMetaRow: {
    flexDirection: 'row',
    marginTop: 24,
    borderTopWidth: 1,
    borderTopColor: BRAND.rule,
    paddingTop: 20,
  },
  coverMetaBlock: {
    flex: 1,
  },
  coverMetaLabel: {
    fontSize: 8,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: BRAND.muted,
    marginBottom: 4,
  },
  coverMetaValue: {
    fontSize: 12,
    color: BRAND.ink,
    fontFamily: 'Helvetica-Bold',
  },
  coverFooter: {
    paddingHorizontal: 72,
    paddingVertical: 24,
    fontSize: 9,
    color: BRAND.muted,
    borderTopWidth: 1,
    borderTopColor: BRAND.rule,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  // -------- TOC --------
  tocTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 22,
    color: BRAND.ink,
    marginBottom: 6,
  },
  tocRule: {
    height: 2,
    backgroundColor: BRAND.gold,
    width: 48,
    marginBottom: 22,
  },
  tocRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
  },
  tocOrdinal: {
    width: 28,
    fontFamily: 'Helvetica-Bold',
    color: BRAND.gold,
    fontSize: 10.5,
  },
  tocHeading: {
    flex: 1,
    color: BRAND.ink,
    fontSize: 10.5,
    textDecoration: 'none',
  },
  tocDots: {
    color: BRAND.rule,
    fontSize: 10,
    marginHorizontal: 4,
  },
  tocPage: {
    width: 28,
    textAlign: 'right',
    fontFamily: 'Helvetica-Bold',
    color: BRAND.muted,
    fontSize: 10,
  },
  // -------- Section content --------
  sectionTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 17,
    color: BRAND.ink,
    marginTop: 18,
    marginBottom: 4,
  },
  sectionRule: {
    height: 1.2,
    backgroundColor: BRAND.gold,
    width: 36,
    marginBottom: 14,
  },
  subheading: {
    fontFamily: 'Times-Bold',
    fontSize: 12,
    color: BRAND.ink,
    marginTop: 12,
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 10.5,
    lineHeight: 1.55,
    color: BRAND.body,
    marginBottom: 8,
  },
  strong: { fontFamily: 'Helvetica-Bold', color: BRAND.ink },
  emphasis: { fontFamily: 'Helvetica-Oblique' },
  code: {
    fontFamily: 'Courier',
    fontSize: 9.5,
    backgroundColor: '#F3EFDD',
    color: BRAND.ink,
  },
  link: {
    color: BRAND.gold,
    textDecoration: 'underline',
  },
  // -------- Table --------
  table: {
    marginTop: 6,
    marginBottom: 12,
    borderTopWidth: 1,
    borderColor: BRAND.rule,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.rule,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    backgroundColor: '#F7F2E1',
    borderBottomWidth: 1,
    borderBottomColor: BRAND.gold,
  },
  tableHeaderCell: {
    padding: 6,
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    color: BRAND.ink,
  },
  tableCell: {
    padding: 6,
    fontSize: 9.5,
    color: BRAND.body,
  },
  // -------- Fixed header/footer --------
  runningHeader: {
    position: 'absolute',
    top: 28,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: BRAND.rule,
    paddingBottom: 8,
  },
  runningWordmark: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    letterSpacing: 1.2,
    color: BRAND.ink,
  },
  runningRubric: {
    fontSize: 8,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    color: BRAND.muted,
  },
  pageFooter: {
    position: 'absolute',
    bottom: 28,
    left: 56,
    right: 56,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: BRAND.rule,
    fontSize: 8,
    color: BRAND.muted,
  },
  pageNumber: {
    fontSize: 8,
    color: BRAND.muted,
  },
})

// ---------------------------------------------------------------------------
// Inline & block renderers — mirror the web MDX overrides but emit
// print-friendly components.
// ---------------------------------------------------------------------------

function renderInline(nodes: InlineNode[]): ReactElement[] {
  return nodes.map((node, idx) => {
    switch (node.type) {
      case 'text':
        return <Text key={idx}>{node.value}</Text>
      case 'strong':
        return (
          <Text key={idx} style={styles.strong}>
            {node.value}
          </Text>
        )
      case 'emphasis':
        return (
          <Text key={idx} style={styles.emphasis}>
            {node.value}
          </Text>
        )
      case 'code':
        return (
          <Text key={idx} style={styles.code}>
            {' '}
            {node.value}{' '}
          </Text>
        )
      case 'link':
        return (
          <Link key={idx} src={node.href} style={styles.link}>
            {node.value}
          </Link>
        )
      default: {
        const _exhaustive: never = node
        void _exhaustive
        return <Text key={idx} />
      }
    }
  })
}

function TableBlockPdf({ block }: { block: TableBlock }): ReactElement {
  const colCount = block.headers.length
  const colFlex = colCount > 0 ? 1 / colCount : 1
  return (
    <View style={styles.table} wrap={false}>
      <View style={styles.tableHeaderRow}>
        {block.headers.map((header, idx) => (
          <View
            key={`h-${idx}`}
            style={{ flex: colFlex, paddingHorizontal: 2 }}
          >
            <Text style={styles.tableHeaderCell}>{header}</Text>
          </View>
        ))}
      </View>
      {block.rows.map((row, rowIdx) => (
        <View key={`r-${rowIdx}`} style={styles.tableRow}>
          {row.map((cell, cellIdx) => (
            <View
              key={`r-${rowIdx}-c-${cellIdx}`}
              style={{ flex: colFlex, paddingHorizontal: 2 }}
            >
              <Text style={styles.tableCell}>{cell}</Text>
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

function renderBlock(block: ContentBlock, idx: number): ReactElement {
  const key = `${block.type}-${idx}`
  switch (block.type) {
    case 'paragraph':
      return (
        <Text key={key} style={styles.paragraph}>
          {renderInline(block.children)}
        </Text>
      )
    case 'h3':
      return (
        <Text key={key} style={styles.subheading}>
          {block.text}
        </Text>
      )
    case 'table':
      return <TableBlockPdf key={key} block={block} />
    default: {
      const _exhaustive: never = block
      void _exhaustive
      return <Text key={key} />
    }
  }
}

// ---------------------------------------------------------------------------
// Fixed frame — identical on every non-cover page.
// ---------------------------------------------------------------------------

function RunningHeader() {
  return (
    <View style={styles.runningHeader} fixed>
      <Text style={styles.runningWordmark}>KIAANVERSE</Text>
      <Text style={styles.runningRubric}>Privacy Policy</Text>
    </View>
  )
}

function PageFooter() {
  return (
    <View style={styles.pageFooter} fixed>
      <Text>Kiaanverse · privacy@kiaanverse.com · kiaanverse.com</Text>
      <Text
        style={styles.pageNumber}
        render={({ pageNumber, totalPages }) =>
          `Page ${pageNumber} of ${totalPages}`
        }
      />
    </View>
  )
}

// ---------------------------------------------------------------------------
// Individual pages
// ---------------------------------------------------------------------------

function CoverPage({ doc }: { doc: PrivacyDocument }) {
  const { frontmatter } = doc
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverHero}>
        <Text style={styles.coverWordmark}>KIAANVERSE</Text>
        <Text style={styles.coverTagline}>Spiritual wellness · Gita wisdom</Text>
        <Text style={styles.coverTitle}>Privacy Policy</Text>
        <Text style={styles.coverSubtitle}>{frontmatter.description}</Text>
        <View style={styles.coverMetaRow}>
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaLabel}>Effective date</Text>
            <Text style={styles.coverMetaValue}>
              {formatLastUpdated(frontmatter.effectiveDate)}
            </Text>
          </View>
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaLabel}>Last updated</Text>
            <Text style={styles.coverMetaValue}>
              {formatLastUpdated(frontmatter.lastUpdated)}
            </Text>
          </View>
          <View style={styles.coverMetaBlock}>
            <Text style={styles.coverMetaLabel}>Version</Text>
            <Text style={styles.coverMetaValue}>v{frontmatter.version}</Text>
          </View>
        </View>
      </View>
      <View style={styles.coverFooter}>
        <Text>Kiaanverse · privacy@kiaanverse.com · kiaanverse.com</Text>
        <Text>Compliance: {frontmatter.compliance.join(' · ')}</Text>
      </View>
    </Page>
  )
}

function TableOfContentsPage({ sections }: { sections: PrivacySection[] }) {
  // Each section begins on its own Page, so estimating page numbers is linear
  // from the TOC page (which is page 2). Pages 1 (cover) and 2 (TOC) then
  // section content begin from page 3.
  const TOC_START = 3
  return (
    <Page size="A4" style={styles.page}>
      <RunningHeader />
      <Text style={styles.tocTitle}>Table of Contents</Text>
      <View style={styles.tocRule} />
      {sections.map((section, idx) => {
        const pageNum = TOC_START + idx
        return (
          <View key={section.id} style={styles.tocRow}>
            <Text style={styles.tocOrdinal}>{section.ordinal || '·'}</Text>
            <Link src={`#${section.id}`} style={styles.tocHeading}>
              {section.heading}
            </Link>
            <Text style={styles.tocDots}>
              {'.'.repeat(60).slice(0, Math.max(4, 60 - section.heading.length))}
            </Text>
            <Text style={styles.tocPage}>{pageNum}</Text>
          </View>
        )
      })}
      <PageFooter />
    </Page>
  )
}

function SectionPage({ section }: { section: PrivacySection }) {
  return (
    <Page size="A4" style={styles.page} id={section.id}>
      <RunningHeader />
      <Text style={styles.sectionTitle}>
        {section.ordinal ? `${section.ordinal}. ` : ''}
        {section.heading}
      </Text>
      <View style={styles.sectionRule} />
      {section.blocks.map(renderBlock)}
      <PageFooter />
    </Page>
  )
}

// ---------------------------------------------------------------------------
// Main exported document
// ---------------------------------------------------------------------------

interface PrivacyPDFDocumentProps {
  doc: PrivacyDocument
}

export function PrivacyPDFDocument({ doc }: PrivacyPDFDocumentProps): ReactElement {
  const { frontmatter, sections } = doc
  return (
    <Document
      title={`Kiaanverse Privacy Policy v${frontmatter.version}`}
      author="Kiaanverse"
      subject="Privacy Policy"
      creator="Kiaanverse PDF Generator"
      producer="Kiaanverse (react-pdf)"
      language="en"
      keywords={['privacy', 'policy', 'kiaanverse', ...frontmatter.compliance].join(', ')}
    >
      <CoverPage doc={doc} />
      <TableOfContentsPage sections={sections} />
      {sections.map((section) => (
        <SectionPage key={section.id} section={section} />
      ))}
    </Document>
  )
}

export default PrivacyPDFDocument
