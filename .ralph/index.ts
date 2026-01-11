#!/usr/bin/env npx tsx

import { spawn } from "child_process"
import { appendFileSync, readFileSync, writeFileSync } from "fs"
import { dirname, join, relative } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const logFile = join(__dirname, "events.log")
const cwd = process.cwd()
const rel = (path: string) => relative(cwd, path) || path

// Parse arguments
const args = process.argv.slice(2)
const replayIndex = args.indexOf("--replay")
const replayFile = replayIndex !== -1 ? args[replayIndex + 1] : null
const iterations = replayFile ? 1 : parseInt(args.find(a => /^\d+$/.test(a)) || "1", 10) || 1

// Shared state for output formatting
let trailingNewlines = 2
let needsBlankLineBeforeText = false

const showFileOp = (message: string) => {
  while (trailingNewlines < 2) {
    process.stdout.write("\n")
    trailingNewlines++
  }
  console.log(message)
  trailingNewlines = 1
  needsBlankLineBeforeText = true
}

const processEvent = (event: Record<string, unknown>) => {
  // Stream text deltas as they come in
  if (event.type === "stream_event") {
    const streamEvent = event.event as Record<string, unknown> | undefined
    const delta = streamEvent?.delta as Record<string, unknown> | undefined
    if (delta?.type === "text_delta" && delta.text) {
      if (needsBlankLineBeforeText) {
        process.stdout.write("\n")
        trailingNewlines = 2
        needsBlankLineBeforeText = false
      }
      process.stdout.write(delta.text as string)
      const match = (delta.text as string).match(/\n+$/)
      if (match) {
        trailingNewlines = Math.min(match[0].length, 2)
      } else {
        trailingNewlines = 0
      }
    }
  }

  // Show file reads
  if (event.type === "user") {
    const toolResult = event.tool_use_result as Record<string, unknown> | undefined
    const file = toolResult?.file as Record<string, unknown> | undefined
    if (file?.filePath) {
      showFileOp(`Read: ${rel(file.filePath as string)}`)
    }
  }

  // Show file edits and other tool uses
  if (event.type === "assistant") {
    const message = event.message as Record<string, unknown> | undefined
    const content = message?.content as Array<Record<string, unknown>> | undefined
    if (content) {
      for (const block of content) {
        if (block.type === "tool_use") {
          const input = block.input as Record<string, unknown> | undefined
          if (block.name === "Edit" || block.name === "Write") {
            const filePath = input?.file_path as string | undefined
            if (filePath) {
              showFileOp(`${block.name}: ${rel(filePath)}`)
            }
          } else if (block.name === "Bash") {
            const command = input?.command as string | undefined
            if (command) {
              showFileOp(`$ ${command}`)
            }
          } else if (block.name === "Grep") {
            const pattern = input?.pattern as string | undefined
            const path = input?.path as string | undefined
            showFileOp(`Grep: ${pattern}${path ? ` in ${rel(path)}` : ""}`)
          } else if (block.name === "Glob") {
            const pattern = input?.pattern as string | undefined
            const path = input?.path as string | undefined
            showFileOp(`Glob: ${pattern}${path ? ` in ${rel(path)}` : ""}`)
          } else if (block.name === "TodoWrite") {
            const todos = input?.todos as Array<{ content: string; status: string }> | undefined
            if (todos?.length) {
              const summary = todos
                .map(
                  t =>
                    `[${
                      t.status === "completed" ? "x"
                      : t.status === "in_progress" ? "~"
                      : " "
                    }] ${t.content}`,
                )
                .join("\n         ")
              showFileOp(`TodoWrite:\n         ${summary}`)
            } else {
              showFileOp(`TodoWrite`)
            }
          } else if (block.name === "WebFetch") {
            const url = input?.url as string | undefined
            showFileOp(`WebFetch: ${url}`)
          } else if (block.name === "WebSearch") {
            const query = input?.query as string | undefined
            showFileOp(`WebSearch: ${query}`)
          } else if (block.name === "Task") {
            const description = input?.description as string | undefined
            showFileOp(`Task: ${description}`)
          }
        }
      }
    }
  }
}

const replayLog = (filePath: string) => {
  console.log(`Replaying: ${filePath}`)
  console.log("------------------------------\n")

  const content = readFileSync(filePath, "utf-8")
  // Log file contains pretty-printed JSON objects separated by blank lines
  const eventStrings = content.split(/\n\n+/).filter(s => s.trim())

  for (const eventStr of eventStrings) {
    try {
      const event = JSON.parse(eventStr)
      processEvent(event)
    } catch {
      // Skip malformed entries
    }
  }
  console.log("\n")
}

const runIteration = (i: number) => {
  if (i > iterations) {
    console.log(`Completed ${iterations} iterations.`)
    return
  }

  console.log(`Iteration ${i}`)
  console.log("------------------------------\n")

  // Clear log file at start of each iteration
  writeFileSync(logFile, "")

  const child = spawn(
    "claude",
    [
      "--permission-mode",
      "bypassPermissions",
      "-p",
      "@.ralph/prompt.md",
      "@.ralph/todo.md",
      "@.ralph/progress.md",
      "--output-format",
      "stream-json",
      "--include-partial-messages",
      "--verbose",
    ],
    { stdio: ["inherit", "pipe", "inherit"] },
  )

  let output = ""

  child.stdout.on("data", data => {
    const chunk = data.toString()
    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line)
        appendFileSync(logFile, JSON.stringify(event, null, 2) + "\n\n")
        processEvent(event)
      } catch {
        // Incomplete JSON line, ignore
      }
    }
    output += chunk
  })

  child.on("close", code => {
    if (code !== 0) {
      console.error(`Claude exited with code ${code}`)
      process.exit(1)
    }

    if (output.includes("<result>COMPLETE</result>")) {
      console.log("Todo list complete, exiting.")
      process.exit(0)
    }

    runIteration(i + 1)
  })

  child.on("error", error => {
    console.error("Error running Claude:", error)
    process.exit(1)
  })
}

if (replayFile) {
  replayLog(replayFile)
} else {
  runIteration(1)
}
