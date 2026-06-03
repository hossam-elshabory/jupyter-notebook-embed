interface NotebookMetadata {
    kernelspec?: {
        display_name?: string;
        language?: string;
        name?: string;
    };
    language_info?: {
        name?: string;
        version?: string;
        [key: string]: unknown;
    };
    [key: string]: unknown;
}
interface MarkdownCell {
    cell_type: "markdown";
    source: string[];
    metadata?: Record<string, unknown>;
    id?: string;
}
interface CodeCell {
    cell_type: "code";
    source: string[];
    execution_count: number | null;
    outputs: Output[];
    metadata?: Record<string, unknown>;
    id?: string;
}
interface RawCell {
    cell_type: "raw";
    source: string[];
    metadata?: Record<string, unknown>;
}
type NotebookCell = MarkdownCell | CodeCell | RawCell;
interface StreamOutput {
    output_type: "stream";
    name: "stdout" | "stderr";
    text: string | string[];
}
interface ExecuteResultOutput {
    output_type: "execute_result";
    execution_count: number | null;
    data: MimeBundle;
    metadata?: Record<string, unknown>;
}
interface DisplayDataOutput {
    output_type: "display_data";
    data: MimeBundle;
    metadata?: Record<string, unknown>;
}
interface ErrorOutput {
    output_type: "error";
    ename: string;
    evalue: string;
    traceback: string[];
}
type Output = StreamOutput | ExecuteResultOutput | DisplayDataOutput | ErrorOutput;
interface MimeBundle {
    "text/plain"?: string | string[];
    "text/html"?: string | string[];
    "image/png"?: string;
    "image/svg+xml"?: string;
    "application/javascript"?: string;
    [key: string]: unknown;
}
interface NotebookData {
    cells: NotebookCell[];
    metadata?: NotebookMetadata;
    nbformat?: number;
    nbformat_minor?: number;
}
interface NotebookEmbeddingOptions {
    cacheDir: string;
    downloadFromGitHub: boolean;
    downloadTimeout: number;
    defaultCollapsed: boolean;
    showCellCount: boolean;
    allowedHtmlTags?: string[];
}
interface PendingImage {
    filename: string;
    data: string;
}

export type { CodeCell, DisplayDataOutput, ErrorOutput, ExecuteResultOutput, MarkdownCell, MimeBundle, NotebookCell, NotebookData, NotebookEmbeddingOptions, NotebookMetadata, Output, PendingImage, RawCell, StreamOutput };
