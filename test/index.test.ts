import { randomBytes } from "node:crypto";
import { mkdirSync, rmSync, unlinkSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { watchlist } from "../src/index.js";

const dir = join(
  tmpdir(),
  "watchlist-test-" + randomBytes(4).toString("hex"),
);

function tmpFile(): string {
  return join(dir, randomBytes(4).toString("hex") + ".txt");
}

async function waitFor(
  condition: () => boolean,
  timeout = 3000,
): Promise<void> {
  const start = Date.now();
  while (!condition()) {
    if (Date.now() - start > timeout) {
      throw new Error("waitFor timed out");
    }
    await new Promise<void>((r) => setTimeout(r, 50));
  }
}

beforeEach(() => {
  mkdirSync(dir, { recursive: true });
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

describe("watchlist", () => {
  it("reads initial file content", async () => {
    const file = tmpFile();
    writeFileSync(file, "apple\nbanana\ncherry\n");

    const { set, stop } = watchlist(file);

    expect(set.size).toBe(3);
    expect(set.has("apple")).toBe(true);
    expect(set.has("banana")).toBe(true);
    expect(set.has("cherry")).toBe(true);

    await stop();
  });

  it("returns empty set when file does not exist", async () => {
    const file = tmpFile();

    const { set, stop } = watchlist(file);

    expect(set.size).toBe(0);

    await stop();
  });

  it("updates set when file changes", async () => {
    const file = tmpFile();
    writeFileSync(file, "one\ntwo\n");

    const { set, ready, stop } = watchlist(file);
    await ready;

    writeFileSync(file, "three\nfour\nfive\n");
    await waitFor(() => set.size === 3);

    expect(set.has("three")).toBe(true);
    expect(set.has("four")).toBe(true);
    expect(set.has("five")).toBe(true);
    expect(set.has("one")).toBe(false);

    await stop();
  });

  it("clears set when file is deleted", async () => {
    const file = tmpFile();
    writeFileSync(file, "alpha\nbeta\n");

    const { set, ready, stop } = watchlist(file);
    await ready;

    unlinkSync(file);
    await waitFor(() => set.size === 0);

    expect(set.size).toBe(0);

    await stop();
  });

  it("updates set when file is created after init", async () => {
    const file = tmpFile();

    const { set, ready, stop } = watchlist(file);
    await ready;

    writeFileSync(file, "x\ny\nz\n");
    await waitFor(() => set.size === 3);

    expect(set.has("x")).toBe(true);
    expect(set.has("y")).toBe(true);
    expect(set.has("z")).toBe(true);

    await stop();
  });

  it("trims whitespace from entries", async () => {
    const file = tmpFile();
    writeFileSync(file, "  apple  \n  banana\ncherry  \r\n");

    const { set, stop } = watchlist(file);

    expect(set.size).toBe(3);
    expect(set.has("apple")).toBe(true);
    expect(set.has("banana")).toBe(true);
    expect(set.has("cherry")).toBe(true);

    await stop();
  });

  it("does not update set after stop", async () => {
    const file = tmpFile();
    writeFileSync(file, "initial\n");

    const { set, ready, stop } = watchlist(file);
    await ready;

    await stop();

    writeFileSync(file, "changed\n");
    await new Promise<void>((r) => setTimeout(r, 300));

    expect(set.has("initial")).toBe(true);
    expect(set.has("changed")).toBe(false);
  });
});
