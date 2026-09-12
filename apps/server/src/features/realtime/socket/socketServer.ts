import type { Server as HttpServer } from "node:http";
import { Server } from "socket.io";
import type {
  ClientToServerEvents,
  InterServerEvents,
  ServerToClientEvents,
  SocketData
} from "../types/realtime.js";

export type RealtimeServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>;

export function createRealtimeServer(
  httpServer: HttpServer,
  corsOrigin: boolean | string[]
): RealtimeServer {
  return new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(
    httpServer,
    {
      cors: {
        origin: corsOrigin
      },
      transports: ["websocket", "polling"]
    }
  );
}
