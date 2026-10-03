import { BackButton } from "./BackButton"

/** Declare an opaque top bar so WebKit can suppress its native scroll-edge blur. */
export const Header = ({ title, onBack, rightContent }: Props) => {
  return (
    <header className="bg-khaki-100 sticky top-0 z-40 w-full shrink-0">
      <div className="mx-auto flex max-w-xl items-center justify-between gap-2 px-2 py-2">
        <div className="flex items-center gap-2">
          {onBack && <BackButton onClick={onBack} />}
          {title && <h1 className="text-base font-semibold">{title}</h1>}
        </div>
        {rightContent && <div className="flex items-center gap-2">{rightContent}</div>}
      </div>
    </header>
  )
}

type Props = {
  title?: string
  onBack?: () => void
  rightContent?: React.ReactNode
}
