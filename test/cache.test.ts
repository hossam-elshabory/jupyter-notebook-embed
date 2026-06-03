import { describe, expect, it } from "vitest"
import { urlToHash } from "../src/cache"

describe("cache", () => {
    it("produces deterministic hashes for URLs", () => {
        const url = "https://github.com/user/repo/blob/main/notebook.ipynb"
        const hash1 = urlToHash(url)
        const hash2 = urlToHash(url)
        expect(hash1).toBe(hash2)
        expect(hash1).toHaveLength(16)
    })

    it("produces different hashes for different URLs", () => {
        const hash1 = urlToHash("https://github.com/a/b/blob/main/nb1.ipynb")
        const hash2 = urlToHash("https://github.com/a/b/blob/main/nb2.ipynb")
        expect(hash1).not.toBe(hash2)
    })
})