#!/usr/bin/env npx tsx

import { execSync } from "child_process"

const iterations = parseInt(process.argv[2], 10) || 100

for (let i = 1; i <= iterations; i++) {
  console.log(`Iteration ${i}`)
  console.log("------------------------------")

  try {
    const result = execSync(
      `claude --permission-mode bypassPermissions -p @ralph/prompt.md @plans/todo.md @plans/progress.md`,
      {
        encoding: "utf-8",
        stdio: ["inherit", "pipe", "inherit"],
      },
    )

    console.log(result)

    if (result.includes("<result>COMPLETE</result>")) {
      console.log("Todo list complete, exiting.")
      process.exit(0)
    }
  } catch (error) {
    console.error("Error running Claude:", error)
    process.exit(1)
  }
}

console.log(`Completed ${iterations} iterations.`)
