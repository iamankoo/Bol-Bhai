import cors from "@fastify/cors";
import fastify from "fastify";
import { getCorsOriginOption } from "./core/config/corsConfig.js";
import { createEventBus } from "./core/events/eventBus.js";
import { registerConsoleSubscriber } from "./core/events/subscribers/consoleSubscriber.js";
import { registerLoggerSubscriber } from "./core/events/subscribers/loggerSubscriber.js";
import { RoomMemoryStore } from "./features/rooms/storage/roomMemoryStore.js";
import { createRoomCodeService } from "./features/rooms/services/roomCodeService.js";
import { createRoomService } from "./features/rooms/services/roomService.js";
import { roomRoutes } from "./features/rooms/routes/roomRoutes.js";
import { joinPageRoute } from "./features/rooms/routes/joinPageRoute.js";
import { registerRealtimeGateway } from "./features/realtime/gateway/realtimeGateway.js";
import { rootRoute } from "./routes/root.js";

export function buildApp() {
  const app = fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info"
    }
  });
  const eventBus = createEventBus();
  const corsOrigin = getCorsOriginOption();

  registerConsoleSubscriber(eventBus);
  registerLoggerSubscriber(eventBus, app.log);
  registerRealtimeGateway({
    httpServer: app.server,
    eventBus,
    logger: app.log,
    corsOrigin
  });

  app.register(cors, {
    origin: corsOrigin
  });

  const roomService = createRoomService({
    roomStore: new RoomMemoryStore(),
    roomCodeService: createRoomCodeService(),
    eventBus
  });

  app.register(rootRoute);
  app.register(roomRoutes, {
    prefix: "/api/rooms",
    roomService
  });
  app.register(joinPageRoute, { roomService });

  return app;
}
