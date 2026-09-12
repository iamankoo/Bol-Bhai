import type { EventBus } from "../eventBus.js";
import { EVENT_NAMES } from "../eventTypes.js";

export function registerConsoleSubscriber(eventBus: EventBus): void {
  eventBus.subscribe(EVENT_NAMES.roomCreated, (event) => {
    console.log("[rooms]", event.name, event.payload.room.roomCode);
  });

  eventBus.subscribe(EVENT_NAMES.roomJoined, (event) => {
    console.log("[rooms]", event.name, event.payload.room.roomCode, event.payload.member.username);
  });

  eventBus.subscribe(EVENT_NAMES.roomLeft, (event) => {
    console.log("[rooms]", event.name, event.payload.roomCode, event.payload.member.username);
  });

  eventBus.subscribe(EVENT_NAMES.roomDeleted, (event) => {
    console.log("[rooms]", event.name, event.payload.roomCode);
  });

  eventBus.subscribe(EVENT_NAMES.hostChanged, (event) => {
    console.log(
      "[rooms]",
      event.name,
      event.payload.roomCode,
      event.payload.previousHost.username,
      "->",
      event.payload.newHost.username
    );
  });
}
