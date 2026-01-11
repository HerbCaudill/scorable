import chalk from "chalk"
import { spawn } from "child_process"
import { appendFileSync, writeFileSync } from "fs"
import { dirname, join } from "path"
import { fileURLToPath } from "url"
import { processEvent } from "./processEvent.js"

const __dirname = dirname(fileURLToPath(import.meta.url))
const logFile = join(__dirname, "..", "events.log")

export const runIteration = (i: number, iterations: number) => {
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

  child.on("close", (code, signal) => {
    if (code !== 0) {
      console.error(
        chalk.red(`Claude exited with code ${code}${signal ? ` (signal: ${signal})` : ""}`),
      )
      console.error(chalk.yellow("Last 2000 chars of output:"))
      console.error(chalk.dim(output.slice(-2000)))
      process.exit(1)
    }

    if (output.includes("<result>COMPLETE</result>")) {
      console.log(chalk.green("Todo list complete, exiting."))
      process.exit(0)
    }

    runIteration(i + 1, iterations)
  })

  child.on("error", error => {
    console.error(chalk.red("Error running Claude:"), error)
    process.exit(1)
  })
}
