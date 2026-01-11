#!/usr/bin/env npx tsx

import { spawn } from "child_process"
import { appendFileSync, writeFileSync } from "fs"

const logFile = ".ralph/events.log"

const iterations = parseInt(process.argv[2], 10) || 100

const runIteration = (i: number) => {
  if (i > iterations) {
    console.log(`Completed ${iterations} iterations.`)
    return
  }

  console.log(`Iteration ${i}`)
  console.log("------------------------------")

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
            process.stdout.write(delta.text)
          }
        }

        // Show file reads
        if (event.type === "user" && event.tool_use_result?.file) {
          const file = event.tool_use_result.file
          console.log(`\n📄 Read: ${file.filePath}`)
        }

        // Show file edits
        if (event.type === "assistant" && event.message?.content) {
          for (const block of event.message.content) {
            if (block.type === "tool_use") {
              if (block.name === "Edit" || block.name === "Write") {
                const filePath = block.input?.file_path
                if (filePath) {
                  console.log(`\n✏️  ${block.name}: ${filePath}`)
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
