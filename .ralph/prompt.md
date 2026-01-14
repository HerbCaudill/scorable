Before doing anything, run `pnpm test:all`.

If there are type errors or test failures: YOUR ONLY TASK IS TO FIX THEM.

If there are no type errors or test failures:

In @.ralph/todo.md, Find the highest-priority task to work on and work only on that task. This should be the one YOU decide has the highest priority - not necessarily the first one in the list.

ONLY WORK ON A SINGLE TASK. If the task you choose is especially complex, then your task is to break it into subtasks, replace the original task in the todo file, commit the file, and end your turn.

When you complete a task, before committing:

- Run `pnpm test:all`.
- Where applicable, make new playwright tests to validate your changes and confirm that they pass.
- Update the todo list by checking off the completed task and moving it to the "Done" section.
- Append your progress to the @.ralph/progress.md file. Use this to leave a note for the next person working in the codebase.
- Update CLAUDE.md with anything you learned that could be useful for the next person working in the codebase.

Make one git commit for this task then end your turn. In the body of the commit message, concisely describe the change, including the problem that motivated it and the solution implemented.

If there are no incomplete tasks in the todo list, output <promise>COMPLETE</promise> and exit.
