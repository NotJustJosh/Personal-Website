// ─────────────────────────────────────────────────────────────────────────────
//  Tag categorization + colors.
//
//  Tags in content.ts stay simple strings. Here we sort each into a category so
//  the UI can color-code them:
//    • field   — a discipline / domain (e.g. Machine Learning, Embedded Programming)
//    • tool    — a named technology / language / library / hardware (React, OpenCV)
//    • method  — a technique / skill (Motion Profiling, Power Budget)
//    • general — anything uncategorized
//
//  Classification is by an explicit map first (override here), then a keyword
//  heuristic, then 'general'. Add tags to TAG_CATEGORY to pin their category.
// ─────────────────────────────────────────────────────────────────────────────

export type TagCategory = 'field' | 'tool' | 'method' | 'general'

export const CATEGORY_META: Record<TagCategory, { label: string; color: string }> = {
  field: { label: 'Field', color: '#4cc9f0' },
  tool: { label: 'Tool', color: '#57cc99' },
  method: { label: 'Method', color: '#b08bff' },
  general: { label: 'Other', color: '#9aa4b2' },
}

// Explicit overrides (lowercased tag → category).
const TAG_CATEGORY: Record<string, TagCategory> = {
  react: 'tool',
  typescript: 'tool',
  webgl: 'tool',
  node: 'tool',
  postgresql: 'tool',
  python: 'tool',
  ml: 'field',
  cad: 'tool',
  'tesseract ocr engine': 'tool',
  'open-source computer vision library (opencv)': 'tool',
  'quartus desgin software': 'tool',
  'field-programmable gate array': 'tool',
  'machine learning': 'field',
  'facial recognition': 'field',
  'embedded programming': 'field',
  'wearable technology': 'field',
  'shape-memory alloy': 'field',
  'power budget': 'method',
  'block diagrams': 'method',
  'sensing array': 'method',
  'serial communication': 'method',
  'pulse-width modulation': 'method',
  'motion profiling': 'method',
  idk: 'general',
}

const TOOL_RE = /react|typescript|javascript|python|java\b|node|sql|opencv|tesseract|quartus|fpga|blender|webgl|css|html|matlab|solidworks|\bcad\b|altium/i
const FIELD_RE = /learning|recognition|robotics|embedded|optics|plasma|electromagnetic|wearable|vision|\bai\b|\bml\b|physics|biology|optical/i
const METHOD_RE = /profiling|modulation|budget|diagram|sensing|communication|analysis|design|simulation|control|imaging|filtering/i

export function tagCategory(tag: string): TagCategory {
  const key = tag.trim().toLowerCase()
  if (TAG_CATEGORY[key]) return TAG_CATEGORY[key]
  if (TOOL_RE.test(key)) return 'tool'
  if (FIELD_RE.test(key)) return 'field'
  if (METHOD_RE.test(key)) return 'method'
  return 'general'
}

export function tagColor(tag: string): string {
  return CATEGORY_META[tagCategory(tag)].color
}
