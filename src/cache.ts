import fs from "node:fs/promises"
import path from "node:path"
import crypto from "node:crypto"
import type { NotebookData } from "./types"

const urlToHash = (url: string): string =>
    crypto.createHash("sha256").update(url).digest("hex").slice(0, 16)

export const ensureCacheDir = async (cacheDir: string): Promise<void> => {
    try {
        await fs.mkdir(cacheDir, { recursive: true })
    } catch (error) {
        console.warn(`[NotebookEmbedding] Failed to create cache directory: ${error}`)
    }
}

export const cacheNotebook = async (
    cacheDir: string,
    url: string,
    data: NotebookData,
): Promise<void> => {
    try {
        const hash = urlToHash(url)
        await fs.writeFile(
            path.join(cacheDir, `${hash}.json`),
            JSON.stringify(data, null, 2),
        )
    } catch (error) {
        console.warn(`[NotebookEmbedding] Failed to cache notebook: ${error}`)
    }
}

export const loadCachedNotebook = async (
    cacheDir: string,
    url: string,
): Promise<NotebookData | null> => {
    try {
        const hash = urlToHash(url)
        const raw = await fs.readFile(path.join(cacheDir, `${hash}.json`), "utf-8")
        return JSON.parse(raw) as NotebookData
    } catch {
        return null
    }
}

export const isCacheStale = async (
    url: string,
    timeout: number,
): Promise<boolean> => {
    try {
        let rawUrl = url
        if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
            rawUrl = url
                .replace("github.com", "raw.githubusercontent.com")
                .replace("/blob/", "/")
        }
        const response = await fetch(rawUrl, {
            method: "HEAD",
            signal: AbortSignal.timeout(timeout),
        })
        return response.ok
    } catch {
        return false
    }
}

export const downloadNotebook = async (
    url: string,
    timeout: number,
): Promise<NotebookData | null> => {
    try {
        let rawUrl = url
        if (url.includes("github.com") && !url.includes("raw.githubusercontent.com")) {
            rawUrl = url
                .replace("github.com", "raw.githubusercontent.com")
                .replace("/blob/", "/")
        }
        const response = await fetch(rawUrl, {
            signal: AbortSignal.timeout(timeout),
        })
        if (!response.ok) {
            console.warn(
                `[NotebookEmbedding] Failed to download notebook from ${rawUrl}: ${response.status}`,
            )
            return null
        }
        return JSON.parse(await response.text()) as NotebookData
    } catch (error) {
        console.warn(`[NotebookEmbedding] Error downloading notebook from ${url}:`, error)
        return null
    }
}