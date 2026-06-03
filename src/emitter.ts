import path from "node:path"
import fs from "node:fs/promises"
import type { QuartzEmitterPlugin, BuildCtx, ProcessedContent, FilePath } from "@quartz-community/types"
import { drainImages, hasImages } from "./registry"

export interface NotebookAssetsEmitterOptions { }

const joinSegments = (...segments: string[]) =>
  segments
    .filter((segment) => segment.length > 0)
    .join("/")
    .replace(/\/+/g, "/") as FilePath

const emitAssets = async (ctx: BuildCtx): Promise<FilePath[]> => {
  if (!hasImages()) return []

  const outputPaths: FilePath[] = []
  const images = drainImages()

  const outputDir = path.join(ctx.argv.output, "notebook-assets")
  await fs.mkdir(outputDir, { recursive: true })

  for (const [_url, fileList] of images) {
    for (const image of fileList) {
      const outputPath = joinSegments(ctx.argv.output, "notebook-assets", image.filename)
      const buffer = Buffer.from(image.data, "base64")
      await fs.writeFile(outputPath, buffer)
      outputPaths.push(outputPath)
    }
  }

  return outputPaths
}

export const NotebookAssetsEmitter: QuartzEmitterPlugin<Partial<NotebookAssetsEmitterOptions>> = () => {
  return {
    name: "NotebookAssetsEmitter",
    async emit(ctx, _content, _resources) {
      return emitAssets(ctx)
    },
    async *partialEmit(ctx, content, resources, _changeEvents) {
      const outputPaths = await emitAssets(ctx)
      for (const outputPath of outputPaths) {
        yield outputPath
      }
    },
  }
}