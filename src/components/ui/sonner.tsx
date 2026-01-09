import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      position="top-center"
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-8" />,
        info: <InfoIcon className="size-8" />,
        warning: <TriangleAlertIcon className="size-8" />,
        error: <OctagonXIcon className="size-8" />,
        loading: <Loader2Icon className="size-8 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast: "bg-white text-neutral-900 border-neutral-200",
          success: "!bg-green-50 !text-green-800 !border-green-300",
          error: "!bg-red-50 !text-red-800 !border-red-300",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
