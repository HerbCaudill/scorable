#!/usr/bin/env npx tsx

import { spawn } from "child_process"
import { appendFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const logFile = join(__dirname, "events.log")

const iterations = parseInt(process.argv[2], 10) || 1

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
      "@ralph/prompt.md",
      "@plans/todo.md",
      "@plans/progress.md",
      "--output-format",
      "stream-json",
      "--include-partial-messages",
      "--verbose",
    ],
    { stdio: ["inherit", "pipe", "inherit"] },
  )

  let output = ""
  let trailingNewlines = 2 // Start as if we just had a blank line (after the header)
  let needsBlankLineBeforeText = false // Track if we need blank line before next text

  const showFileOp = (message: string) => {
    // Ensure blank line before file op (need 2 newlines total, console.log adds 1)
    while (trailingNewlines < 2) {
      process.stdout.write("\n")
      trailingNewlines++
    }
    console.log(message)
    trailingNewlines = 1 // console.log adds one newline
    needsBlankLineBeforeText = true // Need blank line before next text block
  }

  child.stdout.on("data", data => {
    const chunk = data.toString()
    // Parse each line of NDJSON and extract text content
    for (const line of chunk.split("\n")) {
      if (!line.trim()) continue
      try {
        const event = JSON.parse(line)
        appendFileSync(logFile, JSON.stringify(event, null, 2) + "\n\n")

        // Stream text deltas as they come in
        if (event.type === "stream_event") {
          const delta = event.event?.delta
          if (delta?.type === "text_delta" && delta.text) {
            // Add blank line after file ops before resuming text
            if (needsBlankLineBeforeText) {
              process.stdout.write("\n")
              trailingNewlines = 2
              needsBlankLineBeforeText = false
            }
            process.stdout.write(delta.text)
            // Count trailing newlines in the text we just wrote
            const match = delta.text.match(/\n+$/)
            if (match) {
              trailingNewlines = Math.min(match[0].length, 2)
            } else {
              trailingNewlines = 0
            }
          }
        }

        // Show file reads
        if (event.type === "user" && event.tool_use_result?.file) {
          const file = event.tool_use_result.file
          showFileOp(`Read: ${file.filePath}`)
        }

        // Show file edits
        if (event.type === "assistant" && event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === "tool_use") {
              if (block.name === "Edit" || block.name === "Write") {
                const filePath = block.input?.file_path
                if (filePath) {
                  showFileOp(`${block.name}: ${filePath}`)
                }
              }
            }
          }
        }
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

runIteration(1)
