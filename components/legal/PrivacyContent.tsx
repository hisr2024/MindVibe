/**
 * components/legal/PrivacyContent.tsx
 *
 * Shared renderer that transforms the parsed privacy MDX AST into styled,
 * accessible React. Both the desktop and mobile shells import this exact
 * component, guaranteeing that the "one source" promise is kept — any edit
 * to copy, heading IDs, or block structure updates both surfaces at once.
 *
 * MDX component overrides live here. The AST from lib/mdx/privacy.ts carries
 * paragraph, heading, table, link, strong, emphasis, and code nodes; each is
 * mapped to a styled element below.
 *
 * Accessibility:
 *   - Section headings use proper h2 with id= anchors for deep linking.
 *   - Tables use <thead>/<tbody>/<th scope="col"> semantics.
 *   - Links are underlined and high-contrast; external links get rel attrs.
 *   - Gold dividers are decorative (aria-hidden).
 *
 * Performance:
 *   - Pure server component — no client JS ships for the content body.
 *   - The interactive TOC/back-to-top lives in sibling client components.
 */

import type {
  ContentBlock,
  InlineNode,
  ParagraphBlock,
  PrivacySection,
  TableBlock,
} from '@/lib/mdx/privacy'

// ---------------------------------------------------------------------------
// MDX component overrides — tagged so tests can assert on them.
// ---------------------------------------------------------------------------

interface HeadingProps {
  id: string
  children: React.ReactNode
}

/** Override: h2 — section heading. Anchor-friendly, scroll-margin for sticky navs. */
export function PrivacyH2({ id, children }: HeadingProps) {
  return (
    <h2
      id={id}
      data-mdx="h2"
      className={[
        'scroll-mt-24 md:scroll-mt-28',
        'font-divine text-2xl md:text-3xl text-[#E8DCC8]',
        'tracking-tight leading-tight',
      ].join(' ')}
    >
      <a
        href={`#${id}`}
        aria-label={`Link to section: ${typeof children === 'string' ? children : id}`}
        className="group inline-flex items-baseline gap-2 no-underline hover:text-[#C8A84B]"
      >
        <span>{children}</span>
        <span
          aria-hidden="true"
          className="opacity-0 text-[#C8A84B] transition-opacity group-hover:opacity-100"
        >
          #
        </span>
      </a>
    </h2>
  )
}

/** Override: h3 — subsection heading. */
export function PrivacyH3({ id, children }: HeadingProps) {
  return (
    <h3
      id={id}
      data-mdx="h3"
      className={[
        'scroll-mt-24 md:scroll-mt-28',
        'font-divine text-lg md:text-xl text-[#E8DCC8]/95',
        'tracking-tight leading-snug mt-8 mb-2',
      ].join(' ')}
    >
      {children}
    </h3>
  )
}

/** Override: p — paragraph. Constrained to sacred 68ch reading measure. */
export function PrivacyP({ children }: { children: React.ReactNode }) {
  return (
    <p
      data-mdx="p"
      className={[
        'font-sans text-[0.975rem] md:text-base leading-[1.78]',
        'text-[#E8DCC8]/92 max-w-[68ch]',
      ].join(' ')}
    >
      {children}
    </p>
  )
}

/** Override: a — link. Context-aware for external href. */
export function PrivacyA({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  const isExternal = /^https?:\/\//i.test(href) && !href.includes('sakha.ai')
  const isMail = href.startsWith('mailto:')
  return (
    <a
      href={href}
      data-mdx="a"
      {...(isExternal
        ? { target: '_blank', rel: 'noopener noreferrer nofollow' }
        : {})}
      className={[
        'font-medium text-[#E8DCC8] underline decoration-[#C8A84B]/60',
        'underline-offset-4 hover:decoration-[#C8A84B]',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        'focus-visible:outline-[#C8A84B]',
      ].join(' ')}
    >
      {children}
      {isExternal ? (
        <span aria-hidden="true" className="ml-0.5 text-[0.7em]">
          ↗
        </span>
      ) : null}
      {isExternal ? <span className="sr-only"> (opens in new tab)</span> : null}
      {isMail ? <span className="sr-only"> (email link)</span> : null}
    </a>
  )
}

/** Override: table — responsive table with overflow-x wrapper. */
export function PrivacyTable({
  headers,
  rows,
  caption,
}: {
  headers: string[]
  rows: string[][]
  caption?: string
}) {
  return (
    <div
      data-mdx="table"
      className="max-w-[68ch] overflow-x-auto rounded-2xl border border-[rgba(200,168,75,0.2)] bg-[rgba(10,10,20,0.6)]"
    >
      <table className="w-full border-collapse text-left font-sans text-sm">
        {caption ? (
          <caption className="px-4 pt-3 text-left text-xs uppercase tracking-[0.18em] text-[rgba(232,220,200,0.55)]">
            {caption}
          </caption>
        ) : null}
        <thead>
          <tr className="border-b border-[rgba(200,168,75,0.25)] bg-[rgba(200,168,75,0.06)]">
            {headers.map((h, idx) => (
              <th
                key={`${h}-${idx}`}
                scope="col"
                className="px-4 py-3 text-[0.78rem] font-semibold uppercase tracking-[0.12em] text-[#E8DCC8]"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={`row-${rowIdx}`}
              className="border-b border-[rgba(200,168,75,0.1)] last:border-b-0"
            >
              {row.map((cell, cellIdx) => (
                <td
                  key={`cell-${rowIdx}-${cellIdx}`}
                  className="px-4 py-3 align-top text-[0.9rem] leading-relaxed text-[#E8DCC8]/90"
                >
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Gold divider between sections — decorative only. */
export function PrivacyDivider() {
  return (
    <hr
      aria-hidden="true"
      className="my-10 border-0 h-px bg-gradient-to-r from-transparent via-[rgba(200,168,75,0.2)] to-transparent"
    />
  )
}

// ---------------------------------------------------------------------------
// Inline + block renderers
// ---------------------------------------------------------------------------

function renderInline(nodes: InlineNode[]): React.ReactNode {
  return nodes.map((node, idx) => {
    switch (node.type) {
      case 'text':
        return <span key={idx}>{node.value}</span>
      case 'strong':
        return (
          <strong key={idx} className="font-semibold text-[#E8DCC8]">
            {node.value}
          </strong>
        )
      case 'emphasis':
        return (
          <em key={idx} className="italic text-[#E8DCC8]">
            {node.value}
          </em>
        )
      case 'code':
        return (
          <code
            key={idx}
            className="rounded bg-[rgba(200,168,75,0.12)] px-1.5 py-0.5 font-mono text-[0.85em] text-[#E8DCC8]"
          >
            {node.value}
          </code>
        )
      case 'link':
        return (
          <PrivacyA key={idx} href={node.href}>
            {node.value}
          </PrivacyA>
        )
      default: {
        // Exhaustive check: the compiler will flag new node types.
        const _exhaustive: never = node
        void _exhaustive
        return null
      }
    }
  })
}

function renderParagraph(block: ParagraphBlock, key: string) {
  return <PrivacyP key={key}>{renderInline(block.children)}</PrivacyP>
}

function renderTable(block: TableBlock, key: string) {
  return <PrivacyTable key={key} headers={block.headers} rows={block.rows} />
}

function renderBlock(block: ContentBlock, idx: number) {
  const key = `${block.type}-${idx}`
  switch (block.type) {
    case 'paragraph':
      return renderParagraph(block, key)
    case 'table':
      return renderTable(block, key)
    case 'h3':
      return (
        <PrivacyH3 key={key} id={block.id}>
          {block.text}
        </PrivacyH3>
      )
    default: {
      const _exhaustive: never = block
      void _exhaustive
      return null
    }
  }
}

// ---------------------------------------------------------------------------
// Main exported renderer
// ---------------------------------------------------------------------------

interface PrivacyContentProps {
  sections: PrivacySection[]
  /** When true, hide gold dividers between sections (mobile uses sticky heads instead). */
  withoutDividers?: boolean
}

export function PrivacyContent({ sections, withoutDividers = false }: PrivacyContentProps) {
  return (
    <div className="privacy-content flex flex-col gap-10">
      {sections.map((section, sectionIdx) => (
        <section
          key={section.id}
          id={`section-${section.id}`}
          aria-labelledby={section.id}
          data-section-id={section.id}
          className="privacy-section flex flex-col gap-4"
        >
          <PrivacyH2 id={section.id}>
            {section.ordinal ? (
              <span className="mr-2 text-[#C8A84B]" aria-hidden="true">
                {section.ordinal}.
              </span>
            ) : null}
            {section.heading}
          </PrivacyH2>
          {section.blocks.map(renderBlock)}
          {!withoutDividers && sectionIdx < sections.length - 1 ? (
            <PrivacyDivider />
          ) : null}
        </section>
      ))}
    </div>
  )
}

export default PrivacyContent
