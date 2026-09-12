import type { AppEvent, EventHandler, EventName } from "./eventTypes.js";

type HandlerRegistry = {
  [Event in EventName]?: Set<EventHandler<Event>>;
};

export class EventEmitter {
  private readonly handlers: HandlerRegistry = {};

  on<Event extends EventName>(name: Event, handler: EventHandler<Event>): () => void {
    const eventHandlers = this.getOrCreateHandlers(name);
    eventHandlers.add(handler);

    return () => {
      eventHandlers.delete(handler);
    };
  }

  emit<Event extends EventName>(event: AppEvent<Event>): void {
    const eventHandlers = this.handlers[event.name] as Set<EventHandler<Event>> | undefined;

    if (!eventHandlers) {
      return;
    }

    for (const handler of eventHandlers) {
      void handler(event);
    }
  }

  private getOrCreateHandlers<Event extends EventName>(name: Event): Set<EventHandler<Event>> {
    const existingHandlers = this.handlers[name] as Set<EventHandler<Event>> | undefined;

    if (existingHandlers) {
      return existingHandlers;
    }

    const nextHandlers = new Set<EventHandler<Event>>();
    this.handlers[name] = nextHandlers as HandlerRegistry[Event];

    return nextHandlers;
  }
}
