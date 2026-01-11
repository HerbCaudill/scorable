import { Button } from "@/components/ui/button"
import { IconArrowLeft } from "@tabler/icons-react"

export const BackButton = ({ onClick }: Props) => {
  return (
    <Button variant="ghost" size="xs" onClick={onClick}>
      <IconArrowLeft size={14} />
      Back
    </Button>
  )
}

type Props = {
  onClick: () => void
}
