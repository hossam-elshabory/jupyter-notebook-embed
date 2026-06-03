import { describe, expect, it } from "vitest"
import path from "node:path"
import fs from "node:fs/promises"
import { tmpdir } from "node:os"
import { NotebookAssetsEmitter } from "../src/emitter"
import { registerImages } from "../src/registry"
import { createCtx } from "./helpers"

describe("NotebookAssetsEmitter", () => {
  it("writes extracted images to notebook-assets directory", async () => {
    const outputDir = await fs.mkdtemp(path.join(tmpdir(), "quartz-notebook-"))
    const ctx = createCtx({ argv: { output: outputDir } })
    const emitter = NotebookAssetsEmitter()

    // Register a test image
    const testPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=="
    registerImages("https://example.com/test.ipynb", [
      { filename: "nb-test-cell0-output0.png", data: testPng },
    ])

    const result = await emitter.emit(ctx, [], {
      css: [],
      js: [],
      additionalHead: [],
    })
    const outputPaths = Array.isArray(result) ? result : await collectAsync(result)

    expect(outputPaths.length).toBe(1)
    expect(outputPaths[0]).toContain("notebook-assets")

    // Verify the file exists and is a valid PNG
    const written = await fs.readFile(outputPaths[0])
    expect(written[0]).toBe(0x89) // PNG signature byte
  })
})

const collectAsync = async <T>(iterable: AsyncIterable<T>): Promise<T[]> => {
  const results: T[] = []
  for await (const item of iterable) {
    results.push(item)
  }
  return results
}