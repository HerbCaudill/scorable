import { useEffect, useRef } from "react"

/** Keep in-progress entry open during browser navigation or an app update. */
export function usePreventReload(
  /** Whether this screen contains uncommitted work. */
  hasDraft: boolean,
) {
  const draft = useRef(hasDraft)
  draft.current = hasDraft

  useEffect(() => {
    /** Block leaving while the current screen has unsaved changes. */
    const beforeUnload = (event: BeforeUnloadEvent) => {
      if (!draft.current) return
      event.preventDefault()
      event.returnValue = ""
    }
    window.addEventListener("beforeunload", beforeUnload)
    return () => window.removeEventListener("beforeunload", beforeUnload)
  }, [])
}
