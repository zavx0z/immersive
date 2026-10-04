import {runTopDownWorkerRequest} from "@zavx0z/immersive-nodes-layout/worker/top-down/executor"
const scope = globalThis as unknown as {
  postMessage?: (message: ReturnType<typeof runTopDownWorkerRequest>) => void
  addEventListener(type: "message", listener: (event: MessageEvent<Parameters<typeof runTopDownWorkerRequest>[0]>) => void): void
}
if (typeof scope.postMessage === "function") {
  scope.addEventListener("message", event => scope.postMessage!(runTopDownWorkerRequest(event.data)))
}
