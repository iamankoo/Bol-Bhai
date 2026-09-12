import type { EventBus } from "../../../core/events/eventBus.js";
import { EVENT_NAMES } from "../../../core/events/eventTypes.js";
import { REALTIME_CLIENT_EVENTS, REALTIME_SERVER_EVENTS } from "../events/realtimeEvents.js";
import { createRealtimeServer, type RealtimeServer } from "../socket/socketServer.js";
import {
  realtimeRoomPayloadSchema,
  voiceSignalEnvelopeSchema
} from "../validators/realtimeSchemas.js";
import type { FastifyBaseLogger } from "fastify";
import type { Server as HttpServer } from "node:http";

type RealtimeGatewayDependencies = {
  httpServer: HttpServer;
  eventBus: EventBus;
  logger: FastifyBaseLogger;
  corsOrigin: boolean | string[];
};

function registerClientEvents(io: RealtimeServer, logger: FastifyBaseLogger): void {
  io.on("connection", (socket) => {
    socket.emit(REALTIME_SERVER_EVENTS.connected, {
      socketId: socket.id
    });

    socket.on(REALTIME_CLIENT_EVENTS.joinRoom, async (payload) => {
      const result = realtimeRoomPayloadSchema.safeParse(payload);

      if (!result.success) {
        logger.warn({ payload }, "[Server] invalid room:join payload");
        return;
      }

      await socket.join(result.data.roomCode);
      logger.debug({ socketId: socket.id, rooms: Array.from(socket.rooms) }, "[JOIN]");

      socket.to(result.data.roomCode).emit(REALTIME_SERVER_EVENTS.peerReady, {
        roomCode: result.data.roomCode,
        socketId: socket.id
      });
    });

    socket.on(REALTIME_CLIENT_EVENTS.leaveRoom, (payload) => {
      const result = realtimeRoomPayloadSchema.safeParse(payload);

      if (!result.success) {
        return;
      }

      void socket.leave(result.data.roomCode);
    });

    socket.on(REALTIME_CLIENT_EVENTS.signalingMessage, (payload) => {
      const result = voiceSignalEnvelopeSchema.safeParse(payload);

      if (!result.success) {
        logger.warn({ payload }, "[Server] invalid voice:signal payload");
        return;
      }

      const { roomCode, message } = result.data;

      // A socket must have actually joined the room it is signaling into —
      // otherwise any connected client could target signaling at a room it was
      // never a member of, since there is no per-member auth to check instead.
      if (!socket.rooms.has(roomCode)) {
        logger.warn(
          { socketId: socket.id, roomCode },
          "[Server] rejected voice:signal from socket outside the room"
        );
        return;
      }

      const targetMemberId =
        "targetMemberId" in message.payload ? message.payload.targetMemberId : null;

      logger.debug(
        { roomCode, targetMemberId, type: message.type },
        "[Server] forwarding voice:signal"
      );
      socket.to(roomCode).emit(REALTIME_SERVER_EVENTS.signalingMessage, { roomCode, message });
    });

    socket.on("disconnect", () => {
      // Socket.IO removes the socket from joined transport rooms automatically.
    });
  });
}

function registerRoomEventBroadcasts(io: RealtimeServer, eventBus: EventBus): void {
  eventBus.subscribe(EVENT_NAMES.roomJoined, (event) => {
    io.to(event.payload.room.roomCode).emit(REALTIME_SERVER_EVENTS.memberJoined, {
      roomCode: event.payload.room.roomCode,
      member: event.payload.member,
      members: event.payload.room.members
    });
  });

  eventBus.subscribe(EVENT_NAMES.roomLeft, (event) => {
    io.to(event.payload.roomCode).emit(REALTIME_SERVER_EVENTS.memberLeft, {
      roomCode: event.payload.roomCode,
      member: event.payload.member,
      members: event.payload.remainingMembers
    });
  });

  eventBus.subscribe(EVENT_NAMES.hostChanged, (event) => {
    io.to(event.payload.roomCode).emit(REALTIME_SERVER_EVENTS.hostChanged, {
      roomCode: event.payload.roomCode,
      previousHost: event.payload.previousHost,
      newHost: event.payload.newHost
    });
  });

  eventBus.subscribe(EVENT_NAMES.roomDeleted, (event) => {
    io.to(event.payload.roomCode).emit(REALTIME_SERVER_EVENTS.roomDeleted, {
      roomCode: event.payload.roomCode
    });
    void io.in(event.payload.roomCode).socketsLeave(event.payload.roomCode);
  });
}

export function registerRealtimeGateway({
  httpServer,
  eventBus,
  logger,
  corsOrigin
}: RealtimeGatewayDependencies): RealtimeServer {
  const io = createRealtimeServer(httpServer, corsOrigin);

  registerClientEvents(io, logger);
  registerRoomEventBroadcasts(io, eventBus);

  return io;
}
