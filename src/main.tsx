import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import { RepoContext } from "@automerge/automerge-repo-react-hooks"
import { repo } from "./lib/repo"
import "./index.css"
import App from "./App.tsx"

// Expose repo for e2e test seeding
declare global {
  interface Window {
    __TEST_REPO__?: typeof repo
  }
}
if (import.meta.env.DEV) {
  window.__TEST_REPO__ = repo
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RepoContext.Provider value={repo}>
      <App />
    </RepoContext.Provider>
  </StrictMode>,
)
