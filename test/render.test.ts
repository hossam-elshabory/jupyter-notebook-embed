import { describe, expect, it } from "vitest"
import { escapeHtml, formatOutput, markdownToHtml } from "../src/render"
import type { StreamOutput, ErrorOutput, ExecuteResultOutput } from "../src/types"

describe("render", () => {
    describe("escapeHtml", () => {
        it("escapes all special characters", () => {
            expect(escapeHtml('<script>alert("xss")</script>')).toBe(
                "&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;",
            )
        })
    })

    describe("markdownToHtml", () => {
        it("converts basic markdown to HTML", async () => {
            const html = await markdownToHtml("**bold** and *italic*")
            expect(html).toContain("<strong>bold</strong>")
            expect(html).toContain("<em>italic</em>")
        })

        it("handles GFM tables", async () => {
            const md = "| A | B |\n|---|---|\n| 1 | 2 |"
            const html = await markdownToHtml(md)
            expect(html).toContain("<table>")
        })
    })

    describe("formatOutput", () => {
        it("formats stream output", () => {
            const output: StreamOutput = {
                output_type: "stream",
                name: "stdout",
                text: "Hello, world!",
            }
            const result = formatOutput(output, 0, 0, "abc", "https://example.com/nb.ipynb")
            expect(result).toContain("Hello, world!")
            expect(result).toContain("notebook-stream-output")
        })

        it("formats error output", () => {
            const output: ErrorOutput = {
                output_type: "error",
                ename: "ValueError",
                evalue: "invalid input",
                traceback: ["Traceback...", "ValueError: invalid input"],
            }
            const result = formatOutput(output, 0, 0, "abc", "https://example.com/nb.ipynb")
            expect(result).toContain("notebook-error-output")
            expect(result).toContain("ValueError")
        })
    })
})