import type { FastifyPluginAsync } from "fastify";
import { z } from "zod";
import type { RoomService } from "../services/roomService.js";
import { roomCodeSchema } from "../validators/roomSchemas.js";
import { renderJoinPage } from "../views/joinPageTemplate.js";

type JoinPageRouteOptions = {
  roomService: RoomService;
};

const joinPageParamsSchema = z.object({
  code: roomCodeSchema
});

export const joinPageRoute: FastifyPluginAsync<JoinPageRouteOptions> = async (
  app,
  { roomService }
) => {
  app.get("/join/:code", async (request, reply) => {
    const result = joinPageParamsSchema.safeParse(request.params);

    if (!result.success) {
      return reply.status(400).type("text/plain").send("Invalid room code.");
    }

    const roomCode = result.data.code;
    let roomExists = true;

    try {
      roomService.getRoom(roomCode);
    } catch {
      roomExists = false;
    }

    return reply.type("text/html; charset=utf-8").send(renderJoinPage({ roomCode, roomExists }));
  });
};
