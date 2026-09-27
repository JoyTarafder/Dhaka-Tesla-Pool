import { describe, it, expect } from "vitest";
import request from "supertest";
import { app } from "./app.js";

describe("Backend Foundation Tests", () => {
  it("GET /health should return 200 with status ok", async () => {
    const response = await request(app).get("/health");
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty("status", "ok");
    expect(response.body).toHaveProperty("service", "dhaka-tesla-pool-backend");
  });

  it("GET /unknown-route should return standard 404 error shape", async () => {
    const response = await request(app).get("/unknown-route");
    expect(response.status).toBe(404);
    expect(response.body).toHaveProperty("success", false);
    expect(response.body.error).toHaveProperty("code", "NOT_FOUND");
  });
});
