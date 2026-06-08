> [!IMPORTANT]
> This plugin is built upon the [quartz-jupyter-embed-plugin](https://github.com/vazome/quartz-jupyter-embed-plugin) plugin with some extra features. The porting of this plugin was done using GLM 5.1 on a ralph loop.
>
# Jupyter Notebook Embed for Quartz

Embed Jupyter notebooks directly into your [Quartz](https://quartz.jzhao.xyz) site. Any link ending in `.ipynb` is automatically rendered as an interactive, styled notebook with cell outputs, images, and one-click Colab/GitHub buttons.

## Highlights

- ✅ **Zero-config embedding** — just link to any `.ipynb` file
- ✅ **GitHub auto-detection** — pastes GitHub URLs directly, raw conversion is automatic
- ✅ **Extracted images** — base64 PNG outputs are written to static files for fast page loads
- ✅ **Collapsible notebooks** — expand/collapse with a pure-CSS toggle (no JS required)
- ✅ **Colab & GitHub buttons** — one-click access to open notebooks externally
- ✅ **Dark mode** — full support for Quartz's light/dark themes
- ✅ **Cached downloads** — notebooks are cached locally with staleness checks

## Install

```bash
npx quartz plugin add github:github:hossam-elshabory/jupyter-notebook-embed
```

## Quick Start

Add the plugin to your `quartz.config.yaml`:

```yaml
plugins:
  - source: github:github:hossam-elshabory/jupyter-notebook-embed
    enabled: true
```

Then just link to a notebook in any markdown file:

```markdown
Check out my analysis: [data-exploration.ipynb](https://github.com/user/repo/blob/main/notebooks/data-exploration.ipynb)
```

That's it — the link will be replaced with a fully rendered notebook.

### Common Options

```yaml
plugins:
  - source: github:github:hossam-elshabory/jupyter-notebook-embed
    enabled: true
    options:
      defaultCollapsed: true # Start notebooks collapsed (default: false)
      showCellCount: false # Hide "N cells" badge (default: true)
      downloadFromGitHub: true # Auto-download from GitHub URLs (default: true)
```

## How It Works

1. **Link detection** — Any `<a>` tag with an `href` ending in `.ipynb` is automatically detected and replaced with the embedded notebook view.

2. **Query parameters** — Control collapse state per-notebook by appending `?collapsed=true` or `?expanded=true` to the link:

   ```markdown
   [notebook.ipynb](https://github.com/user/repo/blob/main/nb.ipynb?collapsed=true)
   ```

3. **GitHub URL conversion** — `github.com` blob URLs are automatically converted to `raw.githubusercontent.com` for downloading. You can paste GitHub URLs directly.

4. **Colab links** — A "Open in Colab" button is automatically generated for notebooks hosted on GitHub.

5. **Image extraction** — Base64-encoded PNG outputs (e.g., matplotlib plots) are extracted to static files in `notebook-assets/` during build, reducing HTML size by up to 80%.

## Configuration Reference

| Option               | Type       | Default                            | Description                                                                     |
| -------------------- | ---------- | ---------------------------------- | ------------------------------------------------------------------------------- |
| `defaultCollapsed`   | `boolean`  | `false`                            | Whether notebooks start collapsed.                                              |
| `showCellCount`      | `boolean`  | `true`                             | Show the "N cells" badge in the header.                                         |
| `downloadFromGitHub` | `boolean`  | `true`                             | Auto-download notebooks from GitHub URLs. Disable for offline builds.           |
| `downloadTimeout`    | `number`   | `10000`                            | Timeout in ms for notebook downloads. ⚙️                                        |
| `cacheDir`           | `string`   | `"quartz/.quartz-cache/notebooks"` | Directory for cached notebook JSON. ⚙️                                          |
| `allowedHtmlTags`    | `string[]` | `undefined`                        | Additional HTML tags to allow in notebook outputs (beyond the safe default). ⚙️ |

<details>
<summary><strong>Advanced: TypeScript Override</strong></summary>

For callback options or custom plugin ordering, use `quartz.ts`:

```ts
import { loadQuartzConfig, loadQuartzLayout } from "./quartz/plugins/loader/config-loader";
import * as NotebookPlugin from "./.quartz/plugins";

// Access individual exports for manual plugin registration
NotebookPlugin.NotebookEmbedding({
  defaultCollapsed: true,
  downloadFromGitHub: true,
});

const config = await loadQuartzConfig();
export default config;
export const layout = await loadQuartzLayout();
```

This plugin exports two components:

- **`NotebookEmbedding`** — The transformer that replaces `.ipynb` links with embedded HTML
- **`NotebookAssetsEmitter`** — The emitter that writes extracted images to the output directory

Both are registered automatically via the plugin manifest. You only need the TS override for advanced customization.

</details>

## Cell Types Supported

| Cell Type                         | Rendering                                       |
| --------------------------------- | ----------------------------------------------- |
| Code cells                        | Syntax-highlighted source with execution counts |
| Stream output (`stdout`/`stderr`) | Monospace pre blocks                            |
| Execute results (text)            | Formatted text output                           |
| Display data (images)             | Extracted PNG files with white background       |
| Display data (HTML)               | Sanitized HTML output                           |
| Error output                      | Styled error tracebacks                         |
| Markdown cells                    | Rendered via remark/rehype pipeline             |

## Security

HTML outputs in notebook cells are sanitized using `rehype-sanitize` with a safe default allowlist. `<script>` tags and event handlers are stripped. Use the `allowedHtmlTags` option to widen the allowlist only if you trust your notebook sources.

## Build & Development

```bash
npm install
npm run build    # Bundle to dist/
npm test         # Run tests
npm run check    # Typecheck + lint + format + test
```

> **Note:** The `dist/` directory is committed to the repository. Quartz uses it for pre-built distribution. After building, always commit the updated `dist/`.

## License

MIT
