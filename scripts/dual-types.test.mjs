import assert from "node:assert/strict"
import { execFileSync } from "node:child_process"
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { test } from "node:test"

for (const [name, declaration] of [
  ["empty", ""],
  ["named", "declare const value: string;\nexport { value };\n"],
  ["default", "declare const value: string;\nexport { value as default };\n"],
  [
    "split types",
    "declare const value: string;\ntype Params = string;\nexport { value as default };\nexport type { Params };\n",
  ],
]) {
  test(name, async () => {
    const dir = await mkdtemp(join(tmpdir(), "dual-types-"))
    try {
      const input = join(dir, "index.d.ts")
      await writeFile(input, declaration)
      execFileSync(process.execPath, ["scripts/dual-types.mjs", input])
      assert.equal(await readFile(join(dir, "index.d.mts"), "utf8"), declaration)
      const cjs = await readFile(join(dir, "index.d.cts"), "utf8")
      if (declaration.includes("as default")) {
        assert.match(cjs, /export = _default;/)
        if (name === "split types") assert.match(cjs, /export type Params =/)
      } else {
        assert.equal(cjs, declaration)
      }
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })
}

test("missing input", () => {
  assert.throws(() =>
    execFileSync(process.execPath, ["scripts/dual-types.mjs"], { stdio: "pipe" }),
  )
})
