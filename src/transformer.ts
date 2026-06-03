import type { PluggableList } from "unified"
import type { Root, Element } from "hast"
import { visit } from "unist-util-visit"
import { fromHtml } from "hast-util-from-html"
import crypto from "node:crypto"
import type { QuartzTransformerPlugin } from "@quartz-community/types"
import type { NotebookEmbeddingOptions, NotebookData } from "./types"
import { ensureCacheDir, downloadNotebook, loadCachedNotebook, isCacheStale, cacheNotebook } from "./cache"
import { cellToHtml } from "./render"
import { ICON_GITHUB, ICON_COLAB } from "./icons"
import style from "./styles/notebook.scss"

const defaultOptions: NotebookEmbeddingOptions = {
  cacheDir: "quartz/.quartz-cache/notebooks",
  downloadFromGitHub: true,
  downloadTimeout: 10000,
  defaultCollapsed: false,
  showCellCount: true,
}

const deterministicId = (url: string): string => {
  const hash = crypto.createHash("sha256").update(url).digest("hex").slice(0, 8)
  return `nb-${hash}`
}

const extractNotebookName = (url: string): string => {
  try {
    return (new URL(url).pathname.split("/").pop() || "notebook.ipynb").replace(".ipynb", "")
  } catch {
    return url.split("/").pop()?.replace(".ipynb", "") || "notebook"
  }
}

const convertToColabUrl = (githubUrl: string): string => {
  try {
    const url = new URL(githubUrl)
    if (url.hostname === "github.com") {
      return `https://colab.research.google.com/github${url.pathname}`
    } else if (url.hostname === "raw.githubusercontent.com") {
      const parts = url.pathname.split("/").filter(Boolean)
      if (parts.length >= 3) {
        const [user, repo, branch, ...rest] = parts
        return `https://colab.research.google.com/github/${user}/${repo}/blob/${branch}/${rest.join("/")}`
      }
    }
    return githubUrl
  } catch {
    return githubUrl
  }
}

const convertToSourceUrl = (url: string): string => {
  try {
    if (url.includes("raw.githubusercontent.com")) {
      const parts = new URL(url).pathname.split("/").filter(Boolean)
      if (parts.length >= 3) {
        const [user, repo, branch, ...rest] = parts
        return `https://github.com/${user}/${repo}/blob/${branch}/${rest.join("/")}`
      }
    }
    return url
  } catch {
    return url
  }
}

const notebookToHtml = async (
  notebook: NotebookData,
  sourceUrl: string,
  isCollapsed: boolean,
  opts: NotebookEmbeddingOptions,
): Promise<string> => {
  const urlHash = deterministicId(sourceUrl).slice(3)
  const cells = (
    await Promise.all(notebook.cells.map((cell, i) => cellToHtml(cell, i, urlHash, sourceUrl)))
  ).join("\n")

  const notebookName = extractNotebookName(sourceUrl)
  const sourceUrlDisplay = convertToSourceUrl(sourceUrl)
  const colabUrl = convertToColabUrl(sourceUrl)
  const uniqueId = deterministicId(sourceUrl)
  const cellCount = opts.showCellCount
    ? `<span class="notebook-cell-count">${notebook.cells.length} cells</span>`
    : ""

  return `
    <div class="jupyter-notebook-embedded" data-notebook-url="${sourceUrl}">
      <input type="checkbox" id="${uniqueId}-toggle" class="notebook-toggle-checkbox" ${isCollapsed ? "checked" : ""} aria-hidden="true" />
      <div class="notebook-header">
        <label for="${uniqueId}-toggle" class="notebook-header-click-target" aria-label="Toggle Notebook"></label>
        <div class="notebook-header-main">
          <span class="notebook-caret">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </span>
          <div class="notebook-title-wrapper">
            <span class="notebook-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
              </svg>
            </span>
            <span class="notebook-title" title="${notebookName}">${notebookName}</span>
            ${cellCount}
          </div>
        </div>
        <div class="notebook-header-actions">
          <a href="${sourceUrlDisplay}" target="_blank" rel="noopener noreferrer"
             class="notebook-action-btn notebook-action-btn--github no-popover" title="View on GitHub">
            ${ICON_GITHUB}
            <span class="btn-label">GitHub</span>
          </a>
          <a href="${colabUrl}" target="_blank" rel="noopener noreferrer"
             class="notebook-action-btn notebook-action-btn--colab no-popover" title="Open in Colab">
            ${ICON_COLAB}
            <span class="btn-label">Colab</span>
          </a>
        </div>
      </div>
      <div class="notebook-cells-container">
        <div class="notebook-cells">${cells}</div>
      </div>
    </div>`
}

export const NotebookEmbedding: QuartzTransformerPlugin<Partial<NotebookEmbeddingOptions>> = (
  userOpts?,
) => {
  const opts = { ...defaultOptions, ...userOpts }

  return {
    name: "NotebookEmbedding",
    htmlPlugins(): PluggableList {
      return [
        () => {
          return async (tree: Root, _file) => {
            await ensureCacheDir(opts.cacheDir)
            const promises: Promise<void>[] = []

            visit(tree, "element", (node: Element) => {
              if (node.tagName === "a" && node.properties?.href) {
                const href = node.properties.href as string

                let cleanHref = href
                let queryString = ""
                let isCollapsed = opts.defaultCollapsed

                const qIndex = cleanHref.indexOf("?")
                if (qIndex !== -1) {
                  queryString = cleanHref.slice(qIndex + 1)
                  cleanHref = cleanHref.slice(0, qIndex)
                  const hashIndex = queryString.indexOf("#")
                  if (hashIndex !== -1) queryString = queryString.slice(0, hashIndex)
                } else {
                  const hashIndex = cleanHref.indexOf("#")
                  if (hashIndex !== -1) cleanHref = cleanHref.slice(0, hashIndex)
                }

                if (queryString) {
                  const params = new URLSearchParams(queryString)
                  if (params.has("collapsed")) {
                    isCollapsed = params.get("collapsed") === "true"
                  } else if (params.has("expanded")) {
                    isCollapsed = params.get("expanded") !== "true"
                  }
                }

                if (cleanHref.endsWith(".ipynb")) {
                  const promise = (async () => {
                    try {
                      let notebook = await loadCachedNotebook(opts.cacheDir, cleanHref)

                      if (!notebook && opts.downloadFromGitHub) {
                        notebook = await downloadNotebook(cleanHref, opts.downloadTimeout)
                        if (notebook) {
                          await cacheNotebook(opts.cacheDir, cleanHref, notebook)
                        }
                      } else if (notebook && opts.downloadFromGitHub) {
                        const stale = await isCacheStale(cleanHref, opts.downloadTimeout)
                        if (stale) {
                          const fresh = await downloadNotebook(cleanHref, opts.downloadTimeout)
                          if (fresh) {
                            notebook = fresh
                            await cacheNotebook(opts.cacheDir, cleanHref, fresh)
                          }
                        }
                      }

                      if (notebook) {
                        const notebookHtml = await notebookToHtml(
                          notebook,
                          cleanHref,
                          isCollapsed,
                          opts,
                        )
                        node.tagName = "div"
                        node.properties = {
                          className: ["notebook-wrapper-container"],
                          "data-notebook-url": cleanHref,
                        }
                        const notebookAst = fromHtml(notebookHtml, { fragment: true })
                        node.children = notebookAst.children as any
                      } else {
                        node.properties = {
                          ...node.properties,
                          className: ["notebook-link-unavailable"],
                        }
                      }
                    } catch (error) {
                      console.warn(
                        `[NotebookEmbedding] Error processing notebook link ${href}:`,
                        error,
                      )
                    }
                  })()
                  promises.push(promise)
                }
              }
            })

            await Promise.all(promises)
          }
        },
      ]
    },
    externalResources() {
      return {
        css: [{ content: style, inline: true }],
        js: [],
        additionalHead: [],
      }
    },
  }
}