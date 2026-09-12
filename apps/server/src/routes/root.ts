import type { FastifyInstance } from "fastify";

export async function rootRoute(app: FastifyInstance) {
  app.get("/", async () => ({
    name: "Bol Bhai API",
    status: "running"
  }));
}
