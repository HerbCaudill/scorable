import { Repo } from "@automerge/automerge-repo"
import { IndexedDBStorageAdapter } from "@automerge/automerge-repo-storage-indexeddb"
import { BroadcastChannelNetworkAdapter } from "@automerge/automerge-repo-network-broadcastchannel"
import { WebSocketClientAdapter } from "@automerge/automerge-repo-network-websocket"

// Public automerge sync server
const SYNC_SERVER_URL = import.meta.env.VITE_SYNC_SERVER_URL || "wss://sync.automerge.org"

export const repo = new Repo({
  network: [new BroadcastChannelNetworkAdapter(), new WebSocketClientAdapter(SYNC_SERVER_URL)],
  storage: new IndexedDBStorageAdapter("scorable-games"),
})
