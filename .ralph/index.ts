#!/usr/bin/env npx tsx

import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { replayLog } from "./lib/replayLog.js"
import { runIteration } from "./lib/runIteration.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const logFile = join(__dirname, "events.log")

// Parse arguments
const args = process.argv.slice(2)
const replayIndex = args.indexOf("--replay")
const replayMode = replayIndex !== -1
const replayFile = replayMode ? args[replayIndex + 1] || logFile : null
const iterations = replayMode ? 1 : parseInt(args.find(a => /^\d+$/.test(a)) || "1", 10) || 1

if (replayFile) {
  replayLog(replayFile)
} else {
  runIteration(1, iterations)
}
