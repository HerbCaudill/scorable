Before doing anything, check that the types check via `pnpm typecheck`, that unit tests pass via `pnpm test`, and that end-to-end tests pass via `pnpm test:pw`.

If there are type errors or test failures: YOUR ONLY TASK IS TO FIX THEM.

If there are no type errors or test failures:

In @.ralph/todo.md, Find the highest-priority task to work on and work only on that task. This should be the one YOU decide has the highest priority - not necessarily the first one in the list.

ONLY WORK ON A SINGLE TASK.

When you complete the task, before committing:

- Check that the types check via `pnpm typecheck`, that unit tests pass via `pnpm test`, and that end-to-end tests pass via `pnpm test:pw`.
- Where applicable, make new playwright tests to validate your changes and confirm that they pass.
- Update the todo list by checking off the completed task and moving it to the "Done" section.
- Append your progress to the @.ralph/progress.md file. Use this to leave a note for the next person working in the codebase.

Make one git commit for this task. If, while implementing the task, you notice the todo list is complete, output <result>COMPLETE</result> and exit.
