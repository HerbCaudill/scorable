#!/usr/bin/env npx tsx

import chalk from "chalk"
import { spawn } from "child_process"
import { appendFileSync, readFileSync, writeFileSync } from "fs"
import { dirname, join, relative } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const logFile = join(__dirname, "events.log")
const cwd = process.cwd()
const rel = (path: string) => relative(cwd, path) || path
const termWidth = process.stdout.columns || 80
const toolIndent = "  "

// Word wrap state for streaming text
let currentLineLength = 0
let lineBuffer = ""

const formatLine = (text: string) => {
  // Convert markdown bold to ANSI bold
  return text.replace(/\*\*([^*]+)\*\*/g, (_, content) => chalk.bold(content))
}

const flushLine = () => {
  if (!lineBuffer) return
  // Calculate visible length (without ** markers)
  const visibleText = lineBuffer.replace(/\*\*([^*]+)\*\*/g, "$1")
  process.stdout.write(formatLine(lineBuffer))
  currentLineLength += visibleText.length
  lineBuffer = ""
}

const writeWrappedText = (text: string) => {
  // Accumulate text, wrap at word boundaries
  for (const char of text) {
    if (char === "\n") {
      flushLine()
      process.stdout.write("\n")
      currentLineLength = 0
    } else if (char === " " || char === "\t") {
      lineBuffer += char
      // Check if we need to wrap - look for last space to break at
      const visibleLength = lineBuffer.replace(/\*\*([^*]+)\*\*/g, "$1").length
      if (currentLineLength + visibleLength > termWidth) {
        // Find last space to break at
        const lastSpace = lineBuffer.lastIndexOf(" ", lineBuffer.length - 2)
        if (lastSpace > 0) {
          const beforeBreak = lineBuffer.slice(0, lastSpace)
          const afterBreak = lineBuffer.slice(lastSpace + 1)
          process.stdout.write(formatLine(beforeBreak))
          process.stdout.write("\n")
          currentLineLength = 0
          lineBuffer = afterBreak
        }
      }
    } else {
      lineBuffer += char
    }
  }
}

// Parse arguments
const args = process.argv.slice(2)
const replayIndex = args.indexOf("--replay")
const replayMode = replayIndex !== -1
const replayFile = replayMode ? args[replayIndex + 1] || logFile : null
const iterations = replayMode ? 1 : parseInt(args.find(a => /^\d+$/.test(a)) || "1", 10) || 1

// Shared state for output formatting
let trailingNewlines = 2
let needsBlankLineBeforeText = false

const showToolUse = (name: string, arg?: string) => {
  flushLine()
  while (trailingNewlines < 2) {
    process.stdout.write("\n")
    trailingNewlines++
  }
  const formatted = arg ? `${chalk.blue(name)} ${chalk.dim(arg)}` : chalk.blue(name)
  console.log(toolIndent + formatted)
  trailingNewlines = 1
  currentLineLength = 0
  lineBuffer = ""
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
      writeWrappedText(delta.text as string)
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
      showToolUse("Read", rel(file.filePath as string))
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
              showToolUse(block.name as string, rel(filePath))
            }
          } else if (block.name === "Bash") {
            const command = input?.command as string | undefined
            if (command) {
              showToolUse("$", command)
            }
          } else if (block.name === "Grep") {
            const pattern = input?.pattern as string | undefined
            const path = input?.path as string | undefined
            showToolUse("Grep", `${pattern}${path ? ` in ${rel(path)}` : ""}`)
          } else if (block.name === "Glob") {
            const pattern = input?.pattern as string | undefined
            const path = input?.path as string | undefined
            showToolUse("Glob", `${pattern}${path ? ` in ${rel(path)}` : ""}`)
          } else if (block.name === "TodoWrite") {
            const todos = input?.todos as Array<{ content: string; status: string }> | undefined
            if (todos?.length) {
              const todoIndent = toolIndent + "    "
              const summary = todos
                .map(
                  t =>
                    `[${
                      t.status === "completed" ? "x"
                      : t.status === "in_progress" ? "~"
                      : " "
                    }] ${t.content}`,
                )
                .join("\n" + todoIndent)
              showToolUse("TodoWrite", "\n" + todoIndent + summary)
            } else {
              showToolUse("TodoWrite")
            }
          } else if (block.name === "WebFetch") {
            const url = input?.url as string | undefined
            showToolUse("WebFetch", url)
          } else if (block.name === "WebSearch") {
            const query = input?.query as string | undefined
            showToolUse("WebSearch", query)
          } else if (block.name === "Task") {
            const description = input?.description as string | undefined
            showToolUse("Task", description)
          }
        }
      }
    }
  }
}

const replayLog = (filePath: string) => {
  console.log(chalk.cyan(`Replaying: ${filePath}`))
  console.log(chalk.dim("─".repeat(40)) + "\n")

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
    console.log(chalk.green(`Completed ${iterations} iterations.`))
    return
  }

  console.log(chalk.cyan(`Iteration ${i}`))
  console.log(chalk.dim("─".repeat(40)) + "\n")

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
      console.error(chalk.red(`Claude exited with code ${code}`))
      process.exit(1)
    }

    if (output.includes("<result>COMPLETE</result>")) {
      console.log(chalk.green("Todo list complete, exiting."))
      process.exit(0)
    }

    runIteration(i + 1)
  })

  child.on("error", error => {
    console.error(chalk.red("Error running Claude:"), error)
    process.exit(1)
  })
}

if (replayFile) {
  replayLog(replayFile)
} else {
  runIteration(1)
}
