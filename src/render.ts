import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";
import type { NotebookCell, Output, PendingImage } from "./types";
import { registerImages } from "./registry";

export const escapeHtml = (text: string): string =>
  text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");

export const markdownToHtml = async (markdown: string): Promise<string> => {
  try {
    const processor = unified()
      .use(remarkParse)
      .use(remarkGfm)
      .use(remarkRehype, { allowDangerousHtml: false })
      .use(rehypeSanitize, defaultSchema)
      .use(rehypeStringify);
    return String((await processor.process(markdown)).value);
  } catch (error) {
    console.warn("[NotebookEmbedding] Error processing markdown:", error);
    return `<p>${escapeHtml(markdown)}</p>`;
  }
};

export const formatOutput = (
  output: Output,
  cellIndex: number,
  outputIndex: number,
  urlHash: string,
  sourceUrl: string,
): string => {
  if (output.output_type === "stream") {
    const text = Array.isArray(output.text) ? output.text.join("") : output.text;
    return `<div class="notebook-stream-output"><pre>${escapeHtml(text)}</pre></div>`;
  }

  if (output.output_type === "execute_result" || output.output_type === "display_data") {
    if (!output.data) return "";
    let content = "";
    const images: PendingImage[] = [];

    if (output.data["text/plain"]) {
      const text = Array.isArray(output.data["text/plain"])
        ? output.data["text/plain"].join("")
        : output.data["text/plain"];
      content += `<div class="notebook-text-output"><pre>${escapeHtml(text)}</pre></div>`;
    }

    if (output.data["image/png"]) {
      const filename = `nb-${urlHash}-cell${cellIndex}-output${outputIndex}.png`;
      images.push({ filename, data: output.data["image/png"] });
      content += `<div class="notebook-image-output"><img src="notebook-assets/${filename}" alt="Plot output" /></div>`;
    }

    if (output.data["text/html"]) {
      const html = Array.isArray(output.data["text/html"])
        ? output.data["text/html"].join("")
        : output.data["text/html"];
      const sanitized = html.replace(/<script[\s\S]*?<\/script>/gi, "");
      content += `<div class="notebook-html-output">${sanitized}</div>`;
    }

    if (images.length > 0) {
      registerImages(sourceUrl, images);
    }

    return content;
  }

  if (output.output_type === "error") {
    const traceback = output.traceback ? output.traceback.join("\n") : "";
    return `<div class="notebook-error-output"><pre>${escapeHtml(traceback)}</pre></div>`;
  }

  return "";
};

export const cellToHtml = async (
  cell: NotebookCell,
  index: number,
  urlHash: string,
  sourceUrl: string,
  language: string,
): Promise<string> => {
  const cellId = `notebook-cell-${index}`;
  let content = "";

  if (cell.cell_type === "markdown") {
    const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source;
    content = `<div class="notebook-markdown-cell">${await markdownToHtml(source)}</div>`;
  } else if (cell.cell_type === "code") {
    const source = Array.isArray(cell.source) ? cell.source.join("") : cell.source;
    const executionCount = cell.execution_count;
    const executionLabel = executionCount != null ? `In [${executionCount}]:` : "In [ ]:";

    const codeBlock = `
      <div class="notebook-code-input">
        <div class="notebook-execution-count">${executionLabel}</div>
        <div class="notebook-code-content">
          <pre><code class="language-${language}">${escapeHtml(source)}</code></pre>
        </div>
      </div>`;

    let outputsHtml = "";
    if (cell.outputs && cell.outputs.length > 0) {
      const outputLabel = executionCount != null ? `Out[${executionCount}]:` : "Out [ ]:";
      outputsHtml = `<div class="notebook-outputs">
        <div class="notebook-output-label">${outputLabel}</div>
        <div class="notebook-output-content">`;
      for (let i = 0; i < cell.outputs.length; i++) {
        const output = cell.outputs[i];
        if (output) {
          outputsHtml += formatOutput(output, index, i, urlHash, sourceUrl);
        }
      }
      outputsHtml += "</div></div>";
    }

    content = `${codeBlock}${outputsHtml}`;
  }

  return `<div id="${cellId}" class="notebook-cell notebook-${cell.cell_type}-cell">${content}</div>`;
};
