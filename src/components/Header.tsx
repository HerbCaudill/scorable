import { BackButton } from "./BackButton"

export const Header = ({ title, onBack, rightContent }: Props) => {
  return (
    <div className="flex items-center justify-between gap-2 p-2">
      <div className="flex items-center gap-2">
        {onBack && <BackButton onClick={onBack} />}
        {title && <h1 className="text-base font-semibold">{title}</h1>}
      </div>
      {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
    </div>
  )
}

type Props = {
  title?: string
  onBack?: () => void
  rightContent?: React.ReactNode
}
