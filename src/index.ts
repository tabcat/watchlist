import { logger } from "@libp2p/logger";
import { watch } from "chokidar";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";

const log = logger("watchlist");

function readLines(filePath: string): string[] {
  try {
    return readFileSync(filePath, "utf8")
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  } catch (err: unknown) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      return [];
    }
    throw err;
  }
}

export function watchlist(
  filePath: string,
): { set: Set<string>; ready: Promise<void>; stop: () => Promise<void>; } {
  const absPath = resolve(filePath);
  const set = new Set<string>(readLines(absPath));
  log("initialized with %d items from %s", set.size, absPath);

  const watcher = watch(dirname(absPath), { ignoreInitial: true });

  const ready = new Promise<void>((resolve) => {
    watcher.once("ready", resolve);
  });

  const sync = (): void => {
    set.clear();
    for (const line of readLines(absPath)) {
      set.add(line);
    }
    log("updated to %d items", set.size);
  };

  watcher.on("add", (p) => {
    if (p === absPath) sync();
  });
  watcher.on("change", (p) => {
    if (p === absPath) sync();
  });
  watcher.on("unlink", (p) => {
    if (p === absPath) {
      set.clear();
      log("file removed, cleared set");
    }
  });

  return { set, ready, stop: () => watcher.close() };
}
