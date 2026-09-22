import { readFile, realpath, stat } from "node:fs/promises";
import { isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

export interface ManifestEntry {
  path: string;
  url: URL;
}

function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function isOutsideRoot(rootPath: string, candidatePath: string): boolean {
  const relativePath = relative(rootPath, candidatePath);
  return (
    relativePath === "" ||
    relativePath === ".." ||
    relativePath.startsWith(`..${sep}`) ||
    isAbsolute(relativePath)
  );
}

export async function resolveManifestEntry(repoRoot: URL): Promise<ManifestEntry> {
  const rootPath = await realpath(fileURLToPath(repoRoot));
  let manifest: unknown;
  try {
    manifest = JSON.parse(
      await readFile(join(rootPath, "package.json"), "utf8"),
    );
  } catch (error: unknown) {
    throw new Error(`could not read package.json: ${toErrorMessage(error)}`);
  }

  if (
    typeof manifest !== "object" ||
    manifest === null ||
    !("pi" in manifest) ||
    typeof manifest.pi !== "object" ||
    manifest.pi === null ||
    !("extensions" in manifest.pi) ||
    !Array.isArray(manifest.pi.extensions)
  ) {
    throw new Error("package.json must declare pi.extensions");
  }

  const extensions: readonly unknown[] = manifest.pi.extensions;
  if (extensions.length !== 1) {
    throw new Error("package.json must declare exactly one pi.extensions entry");
  }
  const entry = extensions[0];
  if (typeof entry !== "string" || entry.length === 0) {
    throw new Error("package.json pi.extensions entry must be non-empty");
  }
  if (
    !entry.startsWith("./") ||
    entry.includes("\0") ||
    entry.includes("://") ||
    /^[A-Za-z][A-Za-z\d+.-]*:/.test(entry) ||
    /(^|[\\/])\.\.([\\/]|$)/.test(entry)
  ) {
    throw new Error(
      `package.json pi.extensions entry must be a contained relative path: ${entry}`,
    );
  }

  const candidatePath = resolve(rootPath, entry);
  if (isOutsideRoot(rootPath, candidatePath)) {
    throw new Error(`extension entry escapes repository root: ${entry}`);
  }

  let realCandidatePath: string;
  try {
    realCandidatePath = await realpath(candidatePath);
  } catch (error: unknown) {
    throw new Error(
      `extension entry does not exist: ${entry} (${toErrorMessage(error)})`,
    );
  }
  if (isOutsideRoot(rootPath, realCandidatePath)) {
    throw new Error(`extension entry escapes repository root: ${entry}`);
  }

  let candidateStat: Awaited<ReturnType<typeof stat>>;
  try {
    candidateStat = await stat(realCandidatePath);
  } catch (error: unknown) {
    throw new Error(
      `could not inspect extension entry: ${entry} (${toErrorMessage(error)})`,
    );
  }
  if (!candidateStat.isFile()) {
    throw new Error(`extension entry must be a regular file: ${entry}`);
  }

  return {
    path: realCandidatePath,
    url: pathToFileURL(realCandidatePath),
  };
}
