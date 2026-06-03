import { QuartzTransformerPlugin, QuartzEmitterPlugin } from '@quartz-community/types';
export { PageGenerator, PageMatcher, QuartzComponent, QuartzComponentConstructor, QuartzComponentProps, QuartzEmitterPlugin, QuartzFilterPlugin, QuartzPageTypePlugin, QuartzPageTypePluginInstance, QuartzTransformerPlugin, StringResource, VirtualPage } from '@quartz-community/types';
import { NotebookEmbeddingOptions } from './types.js';
export { CodeCell, DisplayDataOutput, ErrorOutput, ExecuteResultOutput, MarkdownCell, NotebookCell, NotebookData, Output as NotebookOutput, RawCell, StreamOutput } from './types.js';

declare const NotebookEmbedding: QuartzTransformerPlugin<Partial<NotebookEmbeddingOptions>>;

interface NotebookAssetsEmitterOptions {
}
declare const NotebookAssetsEmitter: QuartzEmitterPlugin<Partial<NotebookAssetsEmitterOptions>>;

export { NotebookAssetsEmitter, NotebookEmbedding, NotebookEmbeddingOptions };
