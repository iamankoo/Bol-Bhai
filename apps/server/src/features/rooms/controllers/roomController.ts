import type { FastifyReply, FastifyRequest } from "fastify";
import { ZodError } from "zod";
import { RoomError } from "../types/errors.js";
import type { RoomService } from "../services/roomService.js";
import {
  createRoomBodySchema,
  getRoomParamsSchema,
  joinRoomBodySchema,
  leaveRoomBodySchema
} from "../validators/roomSchemas.js";

type RoomControllerDependencies = {
  roomService: RoomService;
};

function sendError(reply: FastifyReply, error: unknown) {
  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: "VALIDATION_FAILED",
      message: error.issues[0]?.message ?? "Invalid request."
    });
  }

  if (error instanceof RoomError) {
    return reply.status(error.statusCode).send({
      error: error.code,
      message: error.message
    });
  }

  return reply.status(500).send({
    error: "INTERNAL_SERVER_ERROR",
    message: "Unexpected room infrastructure error."
  });
}

export function createRoomController({ roomService }: RoomControllerDependencies) {
  return {
    createRoom(request: FastifyRequest, reply: FastifyReply) {
      try {
        const body = createRoomBodySchema.parse(request.body);
        const room = roomService.createRoom(body);

        return reply.status(201).send(room);
      } catch (error) {
        return sendError(reply, error);
      }
    },

    joinRoom(request: FastifyRequest, reply: FastifyReply) {
      try {
        const body = joinRoomBodySchema.parse(request.body);
        const room = roomService.joinRoom(body);

        return reply.status(200).send(room);
      } catch (error) {
        return sendError(reply, error);
      }
    },

    leaveRoom(request: FastifyRequest, reply: FastifyReply) {
      try {
        const body = leaveRoomBodySchema.parse(request.body);
        const result = roomService.leaveRoom(body);

        return reply.status(200).send(result);
      } catch (error) {
        return sendError(reply, error);
      }
    },

    getRoom(request: FastifyRequest, reply: FastifyReply) {
      try {
        const params = getRoomParamsSchema.parse(request.params);
        const room = roomService.getRoom(params.code);

        return reply.status(200).send(room);
      } catch (error) {
        return sendError(reply, error);
      }
    },

    listRooms(_request: FastifyRequest, reply: FastifyReply) {
      try {
        return reply.status(200).send({
          rooms: roomService.listRooms()
        });
      } catch (error) {
        return sendError(reply, error);
      }
    }
  };
}
