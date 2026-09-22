// Native Pi smoke check for Feature Spec #1.
//
// Starts the installed Pi binary in documented non-interactive JSON-RPC mode
// (pi --mode rpc, see docs/rpc.md of @earendil-works/pi-coding-agent 0.85.1)
// with --no-session, --no-extensions, --offline, and --extension pointing at
// this slice's entry point. Readiness signal: the documented get_state
// command; a success response proves the extension loaded. Pi 0.85.1 exits
// with code 1 in non-interactive mode when an extension fails to load.
// No model request, credentials, or global/project settings change is required.
import { randomUUID } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resolveManifestEntry } from "./manifest-entry.ts";

const expectedPiVersion = "0.85.1";
const repoRoot = new URL("../", import.meta.url);
const timeoutMs = Number(process.env.PI_SMOKE_TIMEOUT_MS ?? 60_000);

function isReadyResponse(line: string, requestId: string): boolean {
  let value: unknown;
  try {
    value = JSON.parse(line);
  } catch {
    return false;
  }
  if (typeof value !== "object" || value === null) {
    return false;
  }
  return (
    "id" in value &&
    value.id === requestId &&
    "type" in value &&
    value.type === "response" &&
    "command" in value &&
    value.command === "get_state" &&
    "success" in value &&
    value.success === true
  );
}

function piVersion(agentDir: string): string {
  try {
    return execFileSync("pi", ["--version"], {
      encoding: "utf8",
      env: { ...process.env, PI_CODING_AGENT_DIR: agentDir },
      killSignal: "SIGKILL",
      stdio: ["ignore", "pipe", "pipe"],
      timeout: Math.min(timeoutMs, 10_000),
    }).trim();
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`could not verify pi version: ${message}`);
  }
}

async function runSmoke(): Promise<string> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("PI_SMOKE_TIMEOUT_MS must be a positive number");
  }

  const agentDir = await mkdtemp(join(tmpdir(), "pi-note-to-self-smoke-"));
  try {
    const entry = await resolveManifestEntry(repoRoot);
    const version = piVersion(agentDir);
    if (version !== expectedPiVersion) {
      throw new Error(
        `expected pi ${expectedPiVersion}, found ${version || "unknown"}`,
      );
    }

    const requestId = randomUUID();
    const child = spawn(
      "pi",
      [
        "--mode",
        "rpc",
        "--no-session",
        "--no-extensions",
        "--offline",
        "--extension",
        entry.path,
      ],
      {
        env: { ...process.env, PI_CODING_AGENT_DIR: agentDir },
        stdio: ["pipe", "pipe", "inherit"],
      },
    );

    await new Promise<void>((resolve, reject) => {
      let output = "";
      let ready = false;
      let closed = false;
      let terminationRequested = false;
      let timedOut = false;
      let stdinError: Error | undefined;
      let killEscalated = false;
      let killTimer: NodeJS.Timeout | undefined;

      const timeout = setTimeout(() => {
        timedOut = true;
        terminate();
      }, timeoutMs);

      const cleanup = (): void => {
        clearTimeout(timeout);
        if (killTimer) clearTimeout(killTimer);
      };

      const terminate = (): void => {
        if (terminationRequested || closed) return;
        terminationRequested = true;
        child.kill("SIGTERM");
        killTimer = setTimeout(() => {
          if (!closed) {
            killEscalated = true;
            child.kill("SIGKILL");
          }
        }, 1_000);
      };

      child.once("error", (error: Error) => {
        if (closed) return;
        closed = true;
        cleanup();
        reject(new Error(`could not start the pi binary: ${error.message}`));
      });

      child.stdout.on("data", (chunk: Buffer) => {
        output += chunk.toString();
        let newline = output.indexOf("\n");
        while (newline >= 0) {
          const line = output.slice(0, newline).trim();
          output = output.slice(newline + 1);
          if (line && isReadyResponse(line, requestId)) {
            ready = true;
            child.stdin.end();
            terminate();
          }
          newline = output.indexOf("\n");
        }
      });

      child.once(
        "close",
        (code: number | null, signal: NodeJS.Signals | null) => {
          if (closed) return;
          closed = true;
          cleanup();
          if (
            ready &&
            (code === 0 ||
              code === 143 ||
              signal === "SIGTERM" ||
              (killEscalated && (code === 137 || signal === "SIGKILL")))
          ) {
            resolve();
          } else if (ready) {
            reject(
              new Error(
                `pi exited after get_state with code ${code ?? "unknown"} ` +
                  `and signal ${signal ?? "none"}`,
              ),
            );
          } else if (stdinError) {
            reject(
              new Error(`could not send get_state to pi: ${stdinError.message}`),
            );
          } else if (timedOut) {
            reject(
              new Error(`pi did not answer get_state within ${timeoutMs} ms`),
            );
          } else {
            reject(
              new Error(
                `pi exited with code ${code ?? "unknown"} before answering get_state ` +
                  "(extension load failure? see stderr above)",
              ),
            );
          }
        },
      );

      child.stdin.once("error", (error: Error) => {
        if (closed || ready || stdinError) return;
        stdinError = error;
        terminate();
      });
      child.stdin.write(
        `${JSON.stringify({ id: requestId, type: "get_state" })}\n`,
      );
    });
    return entry.path;
  } finally {
    await rm(agentDir, { recursive: true, force: true });
  }
}

try {
  const entry = await runSmoke();
  process.stdout.write(
    `pi smoke check passed: extension loaded via ${entry}\n`,
  );
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`pi smoke check failed: ${message}`);
  process.exitCode = 1;
}
