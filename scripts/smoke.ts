// Native Pi smoke check for Feature Spec #1.
//
// Starts the installed Pi binary in documented non-interactive JSON-RPC mode
// (pi --mode rpc, see docs/rpc.md of @earendil-works/pi-coding-agent 0.85.1)
// with --no-session, --no-extensions, --offline, and --extension pointing at
// this slice's entry point. Readiness signal: the documented get_state
// command; a success response proves the extension loaded. Pi 0.85.1 exits
// with code 1 in non-interactive mode when an extension fails to load.
// No model request, credentials, or settings change is required.
import { execFileSync, spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const expectedPiVersion = "0.85.1";
const entry = fileURLToPath(new URL("../src/index.ts", import.meta.url));
const timeoutMs = Number(process.env.PI_SMOKE_TIMEOUT_MS ?? 60_000);

function isReadyResponse(line: string): boolean {
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
    "type" in value &&
    value.type === "response" &&
    "command" in value &&
    value.command === "get_state" &&
    "success" in value &&
    value.success === true
  );
}

function piVersion(): string {
  return execFileSync("pi", ["--version"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  }).trim();
}

async function runSmoke(): Promise<void> {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    throw new Error("PI_SMOKE_TIMEOUT_MS must be a positive number");
  }
  const version = piVersion();
  if (version !== expectedPiVersion) {
    throw new Error(`expected pi ${expectedPiVersion}, found ${version || "unknown"}`);
  }

  const child = spawn(
    "pi",
    [
      "--mode",
      "rpc",
      "--no-session",
      "--no-extensions",
      "--offline",
      "--extension",
      entry,
    ],
    { stdio: ["pipe", "pipe", "inherit"] },
  );

  await new Promise<void>((resolve, reject) => {
    let output = "";
    let ready = false;
    let closed = false;
    let terminationRequested = false;
    let timedOut = false;
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
        if (!closed) child.kill("SIGKILL");
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
        if (line && isReadyResponse(line)) {
          ready = true;
          terminate();
        }
        newline = output.indexOf("\n");
      }
    });

    child.once("close", (code: number | null) => {
      if (closed) return;
      closed = true;
      cleanup();
      if (ready) {
        resolve();
      } else if (timedOut) {
        reject(new Error(`pi did not answer get_state within ${timeoutMs} ms`));
      } else {
        reject(
          new Error(
            `pi exited with code ${code ?? "unknown"} before answering get_state ` +
              "(extension load failure? see stderr above)",
          ),
        );
      }
    });

    child.stdin.end('{"id":"smoke-1","type":"get_state"}\n');
  });
}

try {
  await runSmoke();
  process.stdout.write(`pi smoke check passed: extension loaded via ${entry}\n`);
} catch (error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`pi smoke check failed: ${message}`);
  process.exitCode = 1;
}
