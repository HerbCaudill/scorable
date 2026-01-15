import fs from "fs"
import os from "os"
import express from "express"
import { WebSocketServer } from "ws"
import { Repo } from "@automerge/automerge-repo"
import { WebSocketServerAdapter } from "@automerge/automerge-repo-network-websocket"
import { NodeFSStorageAdapter } from "@automerge/automerge-repo-storage-nodefs"

const port = parseInt(process.env.PORT || "3031")

// Use temp directory for test data to avoid state between test runs
const dataDir = fs.mkdtempSync(`${os.tmpdir()}/scorable-sync-`)
console.log(`Using data dir: ${dataDir}`)

const socket = new WebSocketServer({ noServer: true })

const app = express()

const repo = new Repo({
  // @ts-expect-error - WebSocketServer type mismatch
  network: [new WebSocketServerAdapter(socket, 60000)],
  storage: new NodeFSStorageAdapter(dataDir),
  // @ts-expect-error - PeerId type is opaque
  peerId: `test-sync-server-${os.hostname()}`,
  sharePolicy: async () => false,
})
void repo // suppress unused warning

app.get("/", (_req, res) => {
  res.send("Scorable test sync server running")
})

const server = app.listen(port, () => {
  console.log(`Sync server listening on port ${port}`)
})

server.on("upgrade", (request, sock, head) => {
  console.log(`WebSocket upgrade request from ${request.socket.remoteAddress}`)
  socket.handleUpgrade(request, sock, head, ws => {
    console.log(`WebSocket connection established`)
    socket.emit("connection", ws, request)
  })
})

process.on("SIGINT", () => {
  socket.close()
  server.close()
  // Clean up temp dir
  fs.rmSync(dataDir, { recursive: true, force: true })
  process.exit(0)
})
