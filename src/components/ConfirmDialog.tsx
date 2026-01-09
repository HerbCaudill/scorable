import type { ReactNode } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  cancelText?: string
  confirmText?: string
  onConfirm: () => void
  /** Additional class names for the confirm button */
  confirmClassName?: string
  /** Optional secondary action (replaces cancel button when provided) */
  secondaryText?: string
  onSecondary?: () => void
  secondaryClassName?: string
}

export const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  cancelText = 'Cancel',
  confirmText = 'Confirm',
  onConfirm,
  confirmClassName,
  secondaryText,
  onSecondary,
  secondaryClassName,
}: Props) => {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription asChild={typeof description !== 'string'}>
            {typeof description === 'string' ? description : <div>{description}</div>}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          {onSecondary ? (
            <AlertDialogAction onClick={onSecondary} className={secondaryClassName}>
              {secondaryText}
            </AlertDialogAction>
          ) : (
            <AlertDialogCancel>{cancelText}</AlertDialogCancel>
          )}
          <AlertDialogAction onClick={onConfirm} className={confirmClassName} autoFocus>
            {confirmText}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
