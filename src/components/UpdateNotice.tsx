import { useEffect, useRef, useState } from "react"
import { registerSW } from "virtual:pwa-register"
import { IconRefresh } from "@tabler/icons-react"
import { Button } from "@/components/ui/button"

/** Offer an explicit update without reloading drafts or other open windows. */
export function UpdateNotice({ beforeReload }: Props) {
  const [waiting, setWaiting] = useState(false)
  const [updating, setUpdating] = useState(false)
  const [error, setError] = useState<string>()
  const update = useRef<ReturnType<typeof registerSW>>(undefined)
  const readyToReload = useRef(false)
  const requested = useRef(false)
  const save = useRef(beforeReload)
  save.current = beforeReload

  /** Honor draft guards before activation and again before reloading. */
  const canReload = () => {
    const leaving = new Event("beforeunload", { cancelable: true })
    window.dispatchEvent(leaving)
    if (!leaving.defaultPrevented) return true
    setError("Finish or cancel your changes, then try again.")
    return false
  }

  /** Restore the update button after a blocked or failed attempt. */
  const resetRequest = () => {
    requested.current = false
    setUpdating(false)
    setWaiting(true)
  }

  /** Persist committed moves and recheck drafts before leaving this window. */
  const reload = async () => {
    try {
      await save.current()
      if (canReload()) {
        location.reload()
        return
      }
    } catch {
      setError("Could not install the update. Try again.")
    }
    resetRequest()
  }

  useEffect(() => {
    // Strict Mode repeats effects; keep registration and its callbacks singular.
    if (update.current) return
    update.current = registerSW({
      onNeedRefresh: () => setWaiting(true),
      onNeedReload: () => {
        readyToReload.current = true
        if (requested.current) {
          void reload()
          return
        }
        resetRequest()
      },
    })
  }, [])

  /** Activate the downloaded worker only after this window consents. */
  const installUpdate = async () => {
    if (requested.current) return
    setError(undefined)
    if (!canReload()) return
    requested.current = true
    setUpdating(true)
    if (readyToReload.current) {
      await reload()
      return
    }
    try {
      await save.current()
      if (!canReload()) {
        resetRequest()
        return
      }
      await update.current?.(true)
    } catch {
      resetRequest()
      setError("Could not install the update. Try again.")
    }
  }

  return waiting ? (
    <aside
      aria-label="App update"
      className="bg-background fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-4 z-75 max-w-[calc(100vw-2rem)] rounded-lg border border-neutral-300 p-3 text-sm shadow-lg"
    >
      <div className="flex items-center gap-3">
        <p role="status">An update is ready.</p>
        <Button size="sm" disabled={updating} onClick={() => void installUpdate()}>
          <IconRefresh aria-hidden="true" size={16} />
          {updating ? "Updating…" : "Update now"}
        </Button>
      </div>
      {error && (
        <p role="alert" className="text-destructive mt-2 max-w-72">
          {error}
        </p>
      )}
    </aside>
  ) : null
}

type Props = {
  /** Save committed game changes before reloading. */
  beforeReload: () => Promise<void>
}
