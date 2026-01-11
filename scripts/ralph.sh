#!/bin/bash
set -e

if [ -z "$1" ]; then
  echo "Usage: $0 <iterations>"
  exit 1
fi

for ((i=1; i<=$1; i++)); do
  echo "Iteration $i"
  echo "------------------------------"
  result=$(claude --permission-mode acceptEdits -p "@plans/todo.md @plans/progress.md \
1. Find the highest-priority feature to work on and work only on that feature. \
This should be the one YOU decide has the highest priority - not necessarily the first one in the list. \
2. Check that the types check via pnpm typecheck and that the tests pass via pnpm test. \
3. Update the todo list by checking off the work that was done. \
4. Append your progress to the progress.md file. \
Use this to leave a note for the next person working in the codebase. \
5. Make a git commit of that feature. \
ONLY WORK ON A SINGLE FEATURE. \
If, while implementing the feature, you notice the todo list is complete, output <promise>COMPLETE</promise> and exit. \
")

  echo "$result"

  if [[ "$result" == *"<promise>COMPLETE</promise>"* ]]; then
    echo "Todo list complete, exiting."
    exit 0
  fi
done

echo "Completed $1 iterations."
