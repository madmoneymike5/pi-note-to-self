import assert from "node:assert/strict";
import test from "node:test";
import { resolveManifestEntry } from "../scripts/manifest-entry.ts";

const repoRoot = new URL("..", import.meta.url);

void test("pi manifest names an existing entry that exports a callable default factory", async () => {
  const entry = await resolveManifestEntry(repoRoot);
  const mod: unknown = await import(entry.url.href);
  assert.ok(
    typeof mod === "object" && mod !== null && "default" in mod,
    `entry ${entry.path} must expose a default export`,
  );
  const factory = mod.default;
  assert.equal(
    typeof factory,
    "function",
    `entry ${entry.path} must export a callable default extension factory`,
  );
  if (typeof factory !== "function") return;
  const throwingPi = new Proxy(
    {},
    {
      get() {
        throw new Error("foundation factory accessed ExtensionAPI");
      },
    },
  );
  assert.doesNotThrow(() =>
    Reflect.apply(factory, undefined, [throwingPi]),
  );
});
