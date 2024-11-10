/** Renders a Scrabble board */
export const Board = ({ board }: Props) => {
  return (
    <div>
      {board.map((row, rowIndex) => (
        <div key={rowIndex} className="Row">
          {row.map((value, colIndex) => (
            <div key={colIndex} className="Cell">
              {
                // If the cell contains a letter or space, render a tile
                value.match(/[A-Z ]/) ? <Tile value={value} /> : null
              }
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}

export const Tile = ({ value }: { value: string }) => {
  return <div className="Tile">{value}</div>
}

type Props = {
  board: BoardState
}

type BoardState = string[][]

export const initialBoard: BoardState = Array(15)
  .fill(null)
  .map(() => Array(15).fill(''))

export const toBoardState = (board: string): BoardState => {
  const rows = board.split('\n')
  return rows.map((row) => row.split(''))
}

export const fromBoardState = (board: BoardState): string => {
  return board.map((row) => row.join('')).join('\n')
}
