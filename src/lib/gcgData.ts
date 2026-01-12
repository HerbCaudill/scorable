// Import GCG files as raw strings for creating test games
import anno57595 from "../../e2e/games/anno57595.gcg?raw"
import anno57629 from "../../e2e/games/anno57629.gcg?raw"
import anno57680 from "../../e2e/games/anno57680.gcg?raw"
import anno57691 from "../../e2e/games/anno57691.gcg?raw"
import anno57697 from "../../e2e/games/anno57697.gcg?raw"
import anno57701 from "../../e2e/games/anno57701.gcg?raw"
import anno57721 from "../../e2e/games/anno57721.gcg?raw"
import anno57741 from "../../e2e/games/anno57741.gcg?raw"
import nearEndGame from "../../e2e/games/near-end-game.gcg?raw"

// Regular games for test game creation - excludes cresta-yorra-2006 which is the
// highest scoring Scrabble game of all time and would skew statistics
export const gcgFiles = [
  { name: "anno57595", content: anno57595 },
  { name: "anno57629", content: anno57629 },
  { name: "anno57680", content: anno57680 },
  { name: "anno57691", content: anno57691 },
  { name: "anno57697", content: anno57697 },
  { name: "anno57701", content: anno57701 },
  { name: "anno57721", content: anno57721 },
  { name: "anno57741", content: anno57741 },
  { name: "near-end-game", content: nearEndGame },
]
