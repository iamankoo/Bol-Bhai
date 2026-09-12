import type { FastifyPluginAsync } from "fastify";
import { createRoomController } from "../controllers/roomController.js";
import type { RoomService } from "../services/roomService.js";

type RoomRoutesOptions = {
  roomService: RoomService;
};

export const roomRoutes: FastifyPluginAsync<RoomRoutesOptions> = async (app, { roomService }) => {
  const controller = createRoomController({ roomService });

  app.post("/create", controller.createRoom);
  app.post("/join", controller.joinRoom);
  app.post("/leave", controller.leaveRoom);
  app.get("/:code", controller.getRoom);
  app.get("/", controller.listRooms);
};
