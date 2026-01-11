import { useState, useEffect, useCallback } from "react"
import type { DocumentId } from "@automerge/automerge-repo"

export type Route =
  | { screen: "home" }
  | { screen: "new-game" }
  | { screen: "game"; gameId: DocumentId }
  | { screen: "view-past-game"; gameId: DocumentId }
  | { screen: "tiles"; gameId: DocumentId }
  | { screen: "statistics" }

/** Parse URL hash into a route */
const parseHash = (): Route => {
  const hash = window.location.hash.slice(1) // Remove leading #

  if (!hash || hash === "/") {
    return { screen: "home" }
  }

  if (hash === "/new") {
    return { screen: "new-game" }
  }

  if (hash === "/statistics") {
    return { screen: "statistics" }
  }

  // Match /game/:id
  const gameMatch = hash.match(/^\/game\/(.+)$/)
  if (gameMatch) {
    return { screen: "game", gameId: gameMatch[1] as DocumentId }
  }

  // Match /view/:id
  const viewMatch = hash.match(/^\/view\/(.+)$/)
  if (viewMatch) {
    return { screen: "view-past-game", gameId: viewMatch[1] as DocumentId }
  }

  // Match /tiles/:id
  const tilesMatch = hash.match(/^\/tiles\/(.+)$/)
  if (tilesMatch) {
    return { screen: "tiles", gameId: tilesMatch[1] as DocumentId }
  }

  // Legacy: bare document ID in hash (for backwards compatibility)
  if (hash && !hash.startsWith("/")) {
    return { screen: "game", gameId: hash as DocumentId }
  }

  return { screen: "home" }
}

/** Convert route to URL hash */
const routeToHash = (route: Route): string => {
  switch (route.screen) {
    case "home":
      return ""
    case "new-game":
      return "#/new"
    case "game":
      return `#/game/${route.gameId}`
    case "view-past-game":
      return `#/view/${route.gameId}`
    case "tiles":
      return `#/tiles/${route.gameId}`
    case "statistics":
      return "#/statistics"
    default:
      return ""
  }
}

export const useRoute = (): [Route, (route: Route) => void] => {
  const [route, setRouteState] = useState<Route>(parseHash)

  useEffect(() => {
    const handleHashChange = () => {
      setRouteState(parseHash())
    }
    window.addEventListener("hashchange", handleHashChange)
    return () => window.removeEventListener("hashchange", handleHashChange)
  }, [])

  const setRoute = useCallback((newRoute: Route) => {
    const hash = routeToHash(newRoute)
    if (hash) {
      window.location.hash = hash
    } else {
      // Remove hash without triggering navigation
      history.pushState("", document.title, window.location.pathname + window.location.search)
      setRouteState(newRoute)
    }
  }, [])

  return [route, setRoute]
}
