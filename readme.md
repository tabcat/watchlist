# @tabcat/watchlist

Reads a newline-delimited text file into a `Set<string>` and keeps it live as the file changes.

Useful for hot-reloadable allowlists, blocklists, peer ID lists, IP lists, or any collection of strings that operators need to edit without restarting a process.

## Install

```sh
npm install @tabcat/watchlist
```

## Usage

```ts
import { watchlist } from "@tabcat/watchlist";

const { set, ready, stop } = watchlist("/etc/myapp/allowlist.txt");

// set is already populated from the current file contents
console.log(set.has("some-entry")); // true / false

// ready resolves once the file watcher is active
await ready;

// set stays in sync as the file is edited, created, or deleted
// ...

// stop the watcher when done
await stop();
```

The file is expected to have one entry per line. Blank lines and leading/trailing whitespace are ignored. If the file does not exist, the set starts empty and will populate if the file is created later.

## API

See the [API docs](https://tabcat.github.io/newline-set/) for full reference.
