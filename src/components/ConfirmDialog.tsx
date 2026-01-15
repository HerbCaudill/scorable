import type { ReactNode } from "react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { type VariantProps } from "class-variance-authority"
import { buttonVariants } from "@/components/ui/button"

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"]

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  cancelText?: string
  confirmText?: string
  onConfirm: () => void
  /** Button variant for the confirm button */
  confirmVariant?: ButtonVariant
  /** Optional secondary action (replaces cancel button when provided) */
  secondaryText?: string
  onSecondary?: () => void
  secondaryVariant?: ButtonVariant
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText = "Cancel",
  confirmText = "Confirm",
  onConfirm,
  confirmVariant = "default",
  secondaryText,
  onSecondary,
  secondaryVariant = "outline",
}: Props) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild={typeof description !== "string"}>
            {typeof description === "string" ? description : <div>{description}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {onSecondary ?
            <AlertDialogAction
              onClick={onSecondary}
              className={buttonVariants({ variant: secondaryVariant })}
            >
              {secondaryText}
            </AlertDialogAction>
          : <AlertDialogCancel>{cancelText}</AlertDialogCancel>}
          <AlertDialogAction
            onClick={onConfirm}
            className={buttonVariants({ variant: confirmVariant })}
            autoFocus
          >
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
