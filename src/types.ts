import type {
  BuildCtx,
  ChangeEvent,
  CSSResource,
  JSResource,
  ProcessedContent,
  QuartzEmitterPlugin,
  QuartzEmitterPluginInstance,
  QuartzFilterPlugin,
  QuartzFilterPluginInstance,
  QuartzPluginData,
  QuartzTransformerPlugin,
  QuartzTransformerPluginInstance,
  StaticResources,
  PageMatcher,
  PageGenerator,
  VirtualPage,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
} from "@quartz-community/types"

// ── Notebook JSON Structure (nbformat 4) ──

export interface NotebookMetadata {
  kernelspec?: { display_name?: string; language?: string; name?: string }
  language_info?: { name?: string; version?: string;[key: string]: unknown }
  [key: string]: unknown
}

export interface MarkdownCell {
  cell_type: "markdown"
  source: string[]
  metadata?: Record<string, unknown>
  id?: string
}

export interface CodeCell {
  cell_type: "code"
  source: string[]
  execution_count: number | null
  outputs: Output[]
  metadata?: Record<string, unknown>
  id?: string
}

export interface RawCell {
  cell_type: "raw"
  source: string[]
  metadata?: Record<string, unknown>
}

export type NotebookCell = MarkdownCell | CodeCell | RawCell

export interface StreamOutput {
  output_type: "stream"
  name: "stdout" | "stderr"
  text: string | string[]
}

export interface ExecuteResultOutput {
  output_type: "execute_result"
  execution_count: number | null
  data: MimeBundle
  metadata?: Record<string, unknown>
}

export interface DisplayDataOutput {
  output_type: "display_data"
  data: MimeBundle
  metadata?: Record<string, unknown>
}

export interface ErrorOutput {
  output_type: "error"
  ename: string
  evalue: string
  traceback: string[]
}

export type Output = StreamOutput | ExecuteResultOutput | DisplayDataOutput | ErrorOutput

export interface MimeBundle {
  "text/plain"?: string | string[]
  "text/html"?: string | string[]
  "image/png"?: string
  "image/svg+xml"?: string
  "application/javascript"?: string
  [key: string]: unknown
}

export interface NotebookData {
  cells: NotebookCell[]
  metadata?: NotebookMetadata
  nbformat?: number
  nbformat_minor?: number
}

// ── Plugin Options ──

export interface NotebookEmbeddingOptions {
  cacheDir: string
  downloadFromGitHub: boolean
  downloadTimeout: number
  defaultCollapsed: boolean
  showCellCount: boolean
  allowedHtmlTags?: string[]
}

// ── Internal Types ──

export interface PendingImage {
  filename: string
  data: string // base64
}