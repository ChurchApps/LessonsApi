import { controller, httpGet } from "inversify-express-utils";
import express from "express";
import { sql } from "kysely";
import { getDb } from "../db";

@controller("")
export class HealthController {
  @httpGet("/")
  public async root(req: express.Request, res: express.Response): Promise<void> {
    res.status(200).json({ name: "LessonsApi", version: "1.0.0", status: "running", timestamp: new Date().toISOString() });
  }

  @httpGet("/favicon.ico")
  public async favicon(req: express.Request, res: express.Response): Promise<void> {
    res.status(204).end();
  }
}

@controller("/health")
export class HealthCheckController {
  @httpGet("/")
  public async health(req: express.Request, res: express.Response): Promise<void> {
    const environment = process.env.APP_ENV || "unknown";
    const loaded: string[] = [];
    try {
      await sql`SELECT 1`.execute(getDb());
      loaded.push("lessons");
    } catch {
      // Leave loaded empty so callers know the lessons DB is not reachable.
    }
    res.status(200).json({
      status: loaded.length === 1 ? "healthy" : "degraded",
      environment,
      modules: { loaded },
      timestamp: new Date().toISOString(),
    });
  }
}
