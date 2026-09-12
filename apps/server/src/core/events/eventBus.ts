import { EventEmitter } from "./eventEmitter.js";
import type { AppEvent, AppEventPayloads, EventHandler, EventName } from "./eventTypes.js";

export type EventBus = {
  emit<Event extends EventName>(name: Event, payload: AppEventPayloads[Event]): void;
  subscribe<Event extends EventName>(name: Event, handler: EventHandler<Event>): () => void;
};

export function createEventBus(): EventBus {
  const emitter = new EventEmitter();

  return {
    emit(name, payload) {
      const event = {
        name,
        payload,
        occurredAt: new Date().toISOString()
      } as AppEvent<typeof name>;

      emitter.emit(event);
    },

    subscribe(name, handler) {
      return emitter.on(name, handler);
    }
  };
}
