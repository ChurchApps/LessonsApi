import { controller, httpGet } from "inversify-express-utils";
import express from "express";

@controller("")
export class HealthController {
  @httpGet("/health")
  public async health(req: express.Request, res: express.Response): Promise<void> {
    res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
  }

  @httpGet("/")
  public async root(req: express.Request, res: express.Response): Promise<void> {
    res.status(200).json({
      name: "LessonsApi",
      version: "1.0.0",
      status: "running",
      timestamp: new Date().toISOString()
    });
  }

  @httpGet("/favicon.ico")
  public async favicon(req: express.Request, res: express.Response): Promise<void> {
    res.status(204).end();
  }
}
