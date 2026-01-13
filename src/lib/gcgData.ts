// Import GCG files as raw strings for creating test games
// Games from woogles.io (anno* files)
import anno57595 from "../../e2e/games/anno57595.gcg?raw"
import anno57629 from "../../e2e/games/anno57629.gcg?raw"
import anno57680 from "../../e2e/games/anno57680.gcg?raw"
import anno57691 from "../../e2e/games/anno57691.gcg?raw"
import anno57701 from "../../e2e/games/anno57701.gcg?raw"
import anno57741 from "../../e2e/games/anno57741.gcg?raw"
import nearEndGame from "../../e2e/games/near-end-game.gcg?raw"

// Games from cross-tables.com (ct* files) - normal scoring range
import ct17123 from "../../e2e/games/ct17123.gcg?raw"
import ct5939 from "../../e2e/games/ct5939.gcg?raw"
import ct4158 from "../../e2e/games/ct4158.gcg?raw"
import ct4048 from "../../e2e/games/ct4048.gcg?raw"
import ct2221 from "../../e2e/games/ct2221.gcg?raw"
import ct741 from "../../e2e/games/ct741.gcg?raw"
import ct54545 from "../../e2e/games/ct54545.gcg?raw"
import ct20031 from "../../e2e/games/ct20031.gcg?raw"
import ct15827 from "../../e2e/games/ct15827.gcg?raw"
import ct38790 from "../../e2e/games/ct38790.gcg?raw"

// Regular games for test game creation
// Excludes:
// - cresta-yorra-2006 (highest scoring Scrabble game ever - 830 points)
// - anno57697 (final score 538 > 500)
// - anno57721 (final score 623 > 500, with moves of 194 and 104 points)
export const gcgFiles = [
  // Original woogles.io games with normal scores
  { name: "anno57595", content: anno57595 },
  { name: "anno57629", content: anno57629 },
  { name: "anno57680", content: anno57680 },
  { name: "anno57691", content: anno57691 },
  { name: "anno57701", content: anno57701 },
  { name: "anno57741", content: anno57741 },
  { name: "near-end-game", content: nearEndGame },
  // cross-tables.com games - all with scores ≤500 and moves ≤100
  { name: "ct17123", content: ct17123 },
  { name: "ct5939", content: ct5939 },
  { name: "ct4158", content: ct4158 },
  { name: "ct4048", content: ct4048 },
  { name: "ct2221", content: ct2221 },
  { name: "ct741", content: ct741 },
  { name: "ct54545", content: ct54545 },
  { name: "ct20031", content: ct20031 },
  { name: "ct15827", content: ct15827 },
  { name: "ct38790", content: ct38790 },
]
