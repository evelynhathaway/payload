import type { Block, BlockSlug, Field } from 'payload'

/**
 * A generic "layout builder" block set, of the kind many Payload projects ship: a handful of
 * container blocks that can nest other blocks, plus leaf content blocks. Blocks reference each
 * other by slug via the config-level `blocks` registry (see config.ts), which is how a realistic
 * layout builder avoids repeating block definitions.
 *
 * The important property for this reproduction is the *shape of the reference graph*, not the
 * specific blocks: several container blocks each reference a wide set of child blocks, and some of
 * those children are themselves containers that reference the same wide set again. The graph is
 * acyclic (references only ever point "downward" toward leaves) but has many diamond paths to the
 * shared leaf blocks — so the number of distinct paths through the graph is very large even though
 * there are only ~35 blocks.
 *
 * Every container also carries a few `group` fields (styling settings) — again typical of a layout
 * builder — which each become their own nested Mongoose schema, multiplying the instance count.
 */

// A few styling groups shared by container blocks. Each `group` becomes its own nested schema, so
// these are part of what multiplies the total Schema instance count per block occurrence.
const spacingGroup: Field = {
  name: 'spacing',
  type: 'group',
  fields: [
    { name: 'paddingTop', type: 'select', options: ['none', 'small', 'medium', 'large'] },
    { name: 'paddingBottom', type: 'select', options: ['none', 'small', 'medium', 'large'] },
    { name: 'marginTop', type: 'select', options: ['none', 'small', 'medium', 'large'] },
    { name: 'marginBottom', type: 'select', options: ['none', 'small', 'medium', 'large'] },
  ],
}

const colorGroup: Field = {
  name: 'color',
  type: 'group',
  fields: [
    { name: 'background', type: 'text' },
    { name: 'foreground', type: 'text' },
    { name: 'accent', type: 'text' },
  ],
}

const alignmentGroup: Field = {
  name: 'alignment',
  type: 'group',
  fields: [
    { name: 'horizontal', type: 'select', options: ['left', 'center', 'right'] },
    { name: 'vertical', type: 'select', options: ['top', 'middle', 'bottom'] },
  ],
}

const stylingFields: Field[] = [spacingGroup, colorGroup, alignmentGroup]

/**
 * Helper to declare a `blocks` field that references other blocks by slug. In Payload the string
 * slugs of blocks registered in `config.blocks` can be listed directly in a blocks field's
 * `blocks` array, which is how blocks reference each other without repeating their definitions.
 */
const childBlocks = (slugs: BlockSlug[]): Field => ({
  name: 'children',
  type: 'blocks',
  blocks: slugs,
})

// The full set of "child" slugs a top-level container can hold.
const containerChildren: BlockSlug[] = [
  'heading',
  'tagline',
  'richText',
  'quote',
  'image',
  'embed',
  'video',
  'button',
  'cardGrid',
  'featureGrid',
  'card',
  'dualCard',
  'grid',
  'splitText',
  'accordion',
  'disclosureList',
  'metricList',
  'specList',
  'comparison',
  'spacingContainer',
  'panel',
  'divider',
]

// The child set a `panel` offers: the full container child set minus the container-like wrappers,
// so that `panel` widens the graph (more diamond paths to the shared leaves) without introducing a
// cycle back up to a container.
const panelChildren: BlockSlug[] = ['heading', 'tagline', 'richText', 'quote', 'image', 'embed', 'video', 'button', 'cardGrid', 'featureGrid', 'card', 'dualCard', 'grid', 'splitText', 'accordion', 'disclosureList', 'metricList', 'specList', 'comparison', 'divider']

// ---- Leaf content blocks (no nested blocks) --------------------------------------------------

const displayText: Block = {
  slug: 'displayText',
  fields: [
    { name: 'text', type: 'text' },
    { name: 'size', type: 'select', options: ['sm', 'md', 'lg', 'xl'] },
  ],
}

const kicker: Block = {
  slug: 'kicker',
  fields: [{ name: 'text', type: 'text' }],
}

const image: Block = {
  slug: 'image',
  fields: [
    { name: 'src', type: 'text' },
    { name: 'alt', type: 'text' },
    alignmentGroup,
  ],
}

const heading: Block = {
  slug: 'heading',
  fields: [
    { name: 'level', type: 'select', options: ['h1', 'h2', 'h3', 'h4'] },
    childBlocks(['displayText', 'kicker', 'image']),
  ],
}

const tagline: Block = {
  slug: 'tagline',
  fields: [childBlocks(['displayText', 'kicker'])],
}

const richText: Block = {
  slug: 'richText',
  fields: [{ name: 'body', type: 'richText' }],
}

const quote: Block = {
  slug: 'quote',
  fields: [
    { name: 'text', type: 'textarea' },
    { name: 'attribution', type: 'text' },
  ],
}

const button: Block = {
  slug: 'button',
  fields: [
    { name: 'label', type: 'text' },
    { name: 'href', type: 'text' },
    { name: 'variant', type: 'select', options: ['primary', 'secondary', 'ghost'] },
  ],
}

const embed: Block = {
  slug: 'embed',
  fields: [{ name: 'url', type: 'text' }],
}

const video: Block = {
  slug: 'video',
  fields: [
    { name: 'url', type: 'text' },
    { name: 'poster', type: 'text' },
  ],
}

const divider: Block = {
  slug: 'divider',
  fields: [{ name: 'style', type: 'select', options: ['solid', 'dashed', 'dotted'] }],
}

const badge: Block = {
  slug: 'badge',
  fields: [
    { name: 'text', type: 'text' },
    colorGroup,
  ],
}

const icon: Block = {
  slug: 'icon',
  fields: [{ name: 'name', type: 'text' }],
}

const date: Block = {
  slug: 'date',
  fields: [{ name: 'value', type: 'date' }],
}

const metric: Block = {
  slug: 'metric',
  fields: [
    { name: 'value', type: 'text' },
    { name: 'label', type: 'text' },
  ],
}

const comparisonCell: Block = {
  slug: 'comparisonCell',
  fields: [{ name: 'value', type: 'text' }],
}

// ---- Mid-level blocks (reference leaves and each other) ---------------------------------------

const card: Block = {
  slug: 'card',
  fields: [
    ...stylingFields,
    childBlocks(['heading', 'image', 'embed', 'video', 'richText', 'date', 'button']),
  ],
}

const dualCard: Block = {
  slug: 'dualCard',
  fields: [childBlocks(['heading', 'image', 'embed', 'video', 'button'])],
}

const cardGrid: Block = {
  slug: 'cardGrid',
  fields: [...stylingFields, childBlocks(['card', 'dualCard'])],
}

const grid: Block = {
  slug: 'grid',
  fields: [...stylingFields, childBlocks(['image', 'embed', 'video', 'card'])],
}

const feature: Block = {
  slug: 'feature',
  fields: [childBlocks(['heading', 'icon', 'button'])],
}

const featureGrid: Block = {
  slug: 'featureGrid',
  fields: [...stylingFields, childBlocks(['feature'])],
}

const splitText: Block = {
  slug: 'splitText',
  fields: [
    ...stylingFields,
    childBlocks(['heading', 'tagline', 'richText', 'quote', 'button', 'divider']),
  ],
}

const accordionItem: Block = {
  slug: 'accordionItem',
  fields: [childBlocks(['richText', 'heading', 'image', 'button'])],
}

const accordion: Block = {
  slug: 'accordion',
  fields: [childBlocks(['heading', 'richText', 'accordionItem'])],
}

const definitionList: Block = {
  slug: 'definitionList',
  fields: [childBlocks(['richText', 'heading'])],
}

const disclosureList: Block = {
  slug: 'disclosureList',
  fields: [childBlocks(['definitionList'])],
}

const metricGroup: Block = {
  slug: 'metricGroup',
  fields: [childBlocks(['metric'])],
}

const metricList: Block = {
  slug: 'metricList',
  fields: [childBlocks(['metricGroup'])],
}

const spec: Block = {
  slug: 'spec',
  fields: [childBlocks(['displayText'])],
}

const specList: Block = {
  slug: 'specList',
  fields: [childBlocks(['spec'])],
}

const comparisonColumn: Block = {
  slug: 'comparisonColumn',
  fields: [childBlocks(['comparisonCell'])],
}

const comparison: Block = {
  slug: 'comparison',
  fields: [childBlocks(['comparisonColumn'])],
}

// ---- Top-level container blocks (the wide, re-entrant nodes) ----------------------------------

const container: Block = {
  slug: 'container',
  fields: [...stylingFields, childBlocks(containerChildren)],
}

// A wide intermediate wrapper referenced by the containers. Because it re-offers most of the child
// set, it adds another full layer of diamond paths to the shared leaf blocks — the main lever for
// how many schemas one layout field expands into.
const panel: Block = {
  slug: 'panel',
  fields: [...stylingFields, childBlocks(panelChildren)],
}

// A second container variant that also references the full child set — this is what turns the
// graph from a tree into a diamond-heavy DAG (two wide nodes both reach the same children).
const spacingContainer: Block = {
  slug: 'spacingContainer',
  fields: [
    ...stylingFields,
    childBlocks(containerChildren.filter((slug) => slug !== 'spacingContainer')),
  ],
}

const hero: Block = {
  slug: 'hero',
  fields: [
    ...stylingFields,
    childBlocks([
      'heading',
      'tagline',
      'richText',
      'quote',
      'image',
      'embed',
      'video',
      'button',
      'cardGrid',
      'featureGrid',
      'card',
      'grid',
      'splitText',
      'accordion',
      'disclosureList',
      'metricList',
      'specList',
      'spacingContainer',
      'divider',
    ]),
  ],
}

const banner: Block = {
  slug: 'banner',
  fields: [
    ...stylingFields,
    childBlocks([
      'heading',
      'tagline',
      'richText',
      'quote',
      'image',
      'embed',
      'video',
      'button',
      'cardGrid',
      'featureGrid',
      'card',
      'grid',
      'splitText',
      'spacingContainer',
      'divider',
    ]),
  ],
}

const slide: Block = {
  slug: 'slide',
  fields: [childBlocks(['heading', 'richText', 'image', 'button', 'badge'])],
}

const carousel: Block = {
  slug: 'carousel',
  fields: [...stylingFields, childBlocks(['slide'])],
}

const timelineItem: Block = {
  slug: 'timelineItem',
  fields: [childBlocks(['heading', 'richText', 'image', 'button', 'badge'])],
}

const timeline: Block = {
  slug: 'timeline',
  fields: [
    ...stylingFields,
    childBlocks([
      'heading',
      'richText',
      'button',
      'image',
      'embed',
      'video',
      'timelineItem',
      'container',
      'hero',
      'banner',
      'carousel',
    ]),
  ],
}

const tabItem: Block = {
  slug: 'tabItem',
  fields: [
    childBlocks([
      'container',
      'card',
      'richText',
      'heading',
      'image',
      'button',
      'accordion',
    ]),
  ],
}

const tabs: Block = {
  slug: 'tabs',
  fields: [
    ...stylingFields,
    childBlocks([
      'container',
      'hero',
      'banner',
      'timeline',
      'carousel',
      'heading',
      'tabItem',
    ]),
  ],
}

/**
 * The complete block registry, registered at the config level so blocks can reference each other
 * by slug (`blockReferences`). Order does not matter.
 */
export const layoutBlocks: Block[] = [
  // containers / wrappers
  container,
  spacingContainer,
  panel,
  hero,
  banner,
  timeline,
  timelineItem,
  tabs,
  tabItem,
  carousel,
  slide,
  // grids and cards
  cardGrid,
  card,
  dualCard,
  grid,
  featureGrid,
  feature,
  splitText,
  // lists
  accordion,
  accordionItem,
  disclosureList,
  definitionList,
  metricList,
  metricGroup,
  specList,
  spec,
  comparison,
  comparisonColumn,
  // text and media leaves
  heading,
  tagline,
  displayText,
  kicker,
  richText,
  quote,
  image,
  embed,
  video,
  button,
  divider,
  badge,
  icon,
  date,
  metric,
  comparisonCell,
]

/** The root blocks that a page's top-level layout field offers. */
export const rootBlockSlugs: BlockSlug[] = [
  'container',
  'hero',
  'banner',
  'timeline',
  'tabs',
  'carousel',
]
