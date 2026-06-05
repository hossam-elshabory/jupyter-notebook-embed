import { describe, expect, it } from "vitest";
import { deterministicId } from "../src/transformer";

describe("NotebookEmbedding", () => {
  it("generates deterministic IDs from URLs", () => {
    const id1 = deterministicId("https://github.com/user/repo/blob/main/nb.ipynb");
    const id2 = deterministicId("https://github.com/user/repo/blob/main/nb.ipynb");
    expect(id1).toBe(id2);
    expect(id1).toMatch(/^nb-[a-f0-9]{8}$/);
  });

  it("generates different IDs for different URLs", () => {
    const id1 = deterministicId("https://github.com/user/repo/blob/main/nb1.ipynb");
    const id2 = deterministicId("https://github.com/user/repo/blob/main/nb2.ipynb");
    expect(id1).not.toBe(id2);
  });
});
