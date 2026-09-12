import type { FastifyBaseLogger } from "fastify";
import type { EventBus } from "../eventBus.js";
import { EVENT_NAMES } from "../eventTypes.js";

export function registerLoggerSubscriber(eventBus: EventBus, logger: FastifyBaseLogger): void {
  eventBus.subscribe(EVENT_NAMES.roomCreated, (event) => {
    logger.info({ event }, "Room created.");
  });

  eventBus.subscribe(EVENT_NAMES.roomJoined, (event) => {
    logger.info({ event }, "Room joined.");
  });

  eventBus.subscribe(EVENT_NAMES.roomLeft, (event) => {
    logger.info({ event }, "Room left.");
  });

  eventBus.subscribe(EVENT_NAMES.roomDeleted, (event) => {
    logger.info({ event }, "Room deleted.");
  });

  eventBus.subscribe(EVENT_NAMES.hostChanged, (event) => {
    logger.info({ event }, "Room host changed.");
  });
}
