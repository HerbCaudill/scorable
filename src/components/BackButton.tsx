import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

export const BackButton = ({ onClick }: Props) => {
  return (
    <Button variant="ghost" size="xs" onClick={onClick} aria-label="Back">
      <IconArrowLeft size={14} />
    </Button>
  )
}

type Props = {
  onClick: () => void
}
