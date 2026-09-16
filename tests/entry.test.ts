import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { fileURLToPath } from "node:url";

interface PackageManifest {
  pi: { extensions: readonly string[] };
}

function isPackageManifest(value: unknown): value is PackageManifest {
  if (typeof value !== "object" || value === null || !("pi" in value)) {
    return false;
  }
  const { pi } = value;
  return (
    typeof pi === "object" &&
    pi !== null &&
    "extensions" in pi &&
    Array.isArray(pi.extensions) &&
    pi.extensions.every((entry: unknown) => typeof entry === "string")
  );
}

const repoRoot = new URL("..", import.meta.url);

void test("pi manifest names an existing entry that exports a callable default factory", async () => {
  const manifest: unknown = JSON.parse(
    await readFile(new URL("package.json", repoRoot), "utf8"),
  );
  assert.ok(isPackageManifest(manifest), "package.json must declare pi.extensions");
  assert.equal(
    manifest.pi.extensions.length,
    1,
    "foundation package must declare exactly one extension entry",
  );

  const entry = manifest.pi.extensions[0];
  assert.ok(entry, "extension entry must be non-empty");
  const entryUrl = new URL(entry, repoRoot);
  await assert.doesNotReject(
    readFile(fileURLToPath(entryUrl)),
    `missing extension entry: ${entry}`,
  );
  const mod: unknown = await import(entryUrl.href);
  assert.ok(
    typeof mod === "object" && mod !== null && "default" in mod,
    `entry ${entry} must expose a default export`,
  );
  assert.equal(
    typeof mod.default,
    "function",
    `entry ${entry} must export a callable default extension factory`,
  );
});
