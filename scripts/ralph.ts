#!/usr/bin/env npx tsx

import { execSync } from "child_process"

const iterations = parseInt(process.argv[2], 10) || 10

const prompt = `@plans/todo.md @plans/progress.md
1. Find the highest-priority feature to work on and work only on that feature.
This should be the one YOU decide has the highest priority - not necessarily the first one in the list.
2. Check that the types check via pnpm typecheck and that the tests pass via pnpm test.
3. Update the todo list by checking off the work that was done.
4. Append your progress to the progress.md file.
Use this to leave a note for the next person working in the codebase.
5. Make a git commit of that feature.
ONLY WORK ON A SINGLE FEATURE.
If, while implementing the feature, you notice the todo list is complete, output <promise>COMPLETE</promise> and exit.`

for (let i = 1; i <= iterations; i++) {
  console.log(`Iteration ${i}`)
  console.log("------------------------------")

  try {
    const result = execSync(
      `claude --permission-mode acceptEdits -p "${prompt.replace(/"/g, '\\"')}"`,
      {
        encoding: "utf-8",
        stdio: ["inherit", "pipe", "inherit"],
      },
    )

    console.log(result)

    if (result.includes("<promise>COMPLETE</promise>")) {
      console.log("Todo list complete, exiting.")
      process.exit(0)
    }
  } catch (error) {
    console.error("Error running claude:", error)
    process.exit(1)
  }
}

console.log(`Completed ${iterations} iterations.`)
