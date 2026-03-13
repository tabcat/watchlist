import { readFileSync, writeFileSync, rmSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { bench, describe, afterAll } from "vitest";

// Mirrors the readLines implementation in src/index.ts
function readLines(filePath: string): string[] {
  try {
    return readFileSync(filePath, "utf8").split("\n").filter(Boolean);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return [];
    throw err;
  }
}

function makeTmpFile(lineCount: number, lineFn: () => string): string {
  const path = join(
    tmpdir(),
    `watchlist-bench-${randomBytes(4).toString("hex")}.txt`,
  );
  const content = Array.from({ length: lineCount }, lineFn).join("\n") + "\n";
  writeFileSync(path, content, "utf8");
  const kb = (Buffer.byteLength(content, "utf8") / 1024).toFixed(0);
  console.log(`  created ${path} (${lineCount} lines, ~${kb}KB)`);
  return path;
}

// ~20 chars: realistic for short hashes, IPs, peer IDs
const shortLine = (): string => randomBytes(10).toString("hex");
// ~120 chars: realistic for multiaddrs, URLs, long identifiers
const longLine = (): string => randomBytes(60).toString("hex");

const tmpFiles: string[] = [];

function tmpOf(lineCount: number, lineFn: () => string): string {
  const p = makeTmpFile(lineCount, lineFn);
  tmpFiles.push(p);
  return p;
}

afterAll(() => {
  for (const f of tmpFiles) rmSync(f, { force: true });
});

describe("short lines (~20 chars each)", () => {
  const f100 = tmpOf(100, shortLine);
  const f500 = tmpOf(500, shortLine);
  const f1k = tmpOf(1_000, shortLine);
  const f5k = tmpOf(5_000, shortLine);
  const f10k = tmpOf(10_000, shortLine);

  bench("100 lines", () => { readLines(f100); });
  bench("500 lines", () => { readLines(f500); });
  bench("1k lines", () => { readLines(f1k); });
  bench("5k lines", () => { readLines(f5k); });
  bench("10k lines", () => { readLines(f10k); });
});

describe("long lines (~120 chars each)", () => {
  const f100 = tmpOf(100, longLine);
  const f500 = tmpOf(500, longLine);
  const f1k = tmpOf(1_000, longLine);
  const f5k = tmpOf(5_000, longLine);
  const f10k = tmpOf(10_000, longLine);

  bench("100 lines", () => { readLines(f100); });
  bench("500 lines", () => { readLines(f500); });
  bench("1k lines", () => { readLines(f1k); });
  bench("5k lines", () => { readLines(f5k); });
  bench("10k lines", () => { readLines(f10k); });
});
