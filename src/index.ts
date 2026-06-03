export { NotebookEmbedding } from "./transformer"
export { NotebookAssetsEmitter } from "./emitter"

export type {
  NotebookEmbeddingOptions,
  NotebookData,
  NotebookCell,
  MarkdownCell,
  CodeCell,
  RawCell,
  Output as NotebookOutput,
  StreamOutput,
  ExecuteResultOutput,
  DisplayDataOutput,
  ErrorOutput,
} from "./types"

// Re-export shared types from @quartz-community/types
export type {
  QuartzComponent,
  QuartzComponentProps,
  QuartzComponentConstructor,
  StringResource,
  QuartzTransformerPlugin,
  QuartzFilterPlugin,
  QuartzEmitterPlugin,
  QuartzPageTypePlugin,
  QuartzPageTypePluginInstance,
  PageMatcher,
  PageGenerator,
  VirtualPage,
} from "@quartz-community/types"