import dotenv from "dotenv";
import "reflect-metadata";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { bindings } from "./inversify.config";
import express from "express";
import { CustomAuthProvider } from "@churchapps/apihelper";
import cors from "cors";

// Kysely's mysql2 driver returns BigInt for ResultSetHeader fields
// (affectedRows, insertId, etc). Without this, controllers that return repo
// delete/update results fail with "Do not know how to serialize a BigInt".
(BigInt.prototype as any).toJSON = function () { return this.toString(); };

export const init = async () => {
  dotenv.config();
  const container = new Container();
  await container.loadAsync(bindings);
  const app = new InversifyExpressServer(container, null, null, null, CustomAuthProvider);

  const configFunction = (expApp: express.Application) => {
    // Configure CORS first
    expApp.use(
      cors({
        origin: true,
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept", "Origin"]
      })
    );

    // Handle preflight requests early
    expApp.options("*", (req, res) => {
      res.header("Access-Control-Allow-Origin", "*");
      res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
      res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin");
      res.sendStatus(200);
    });

    // Custom handler must run BEFORE express.json/urlencoded. In Lambda,
    // @codegenie/serverless-express stages the body on req.body directly and
    // leaves the underlying stream unreadable; if body-parser runs first it
    // throws "stream is not readable" via raw-body. Setting req._body = true
    // after we've handled the body tells body-parser to skip.
    expApp.use((req, res, next) => {
      const contentType = req.headers["content-type"] || "";
      let handled = false;

      // Handle Buffer instances (most common case with serverless-express)
      if (Buffer.isBuffer(req.body)) {
        try {
          const bodyString = req.body.toString("utf8");
          if (contentType.includes("application/json")) {
            req.body = JSON.parse(bodyString);
          } else {
            req.body = bodyString;
          }
        } catch {
          req.body = {};
        }
        handled = true;
      } else if (req.body && req.body.type === "Buffer" && Array.isArray(req.body.data)) {
      // Handle Buffer-like objects
        try {
          const bodyString = Buffer.from(req.body.data).toString("utf8");
          if (contentType.includes("application/json")) {
            req.body = JSON.parse(bodyString);
          } else {
            req.body = bodyString;
          }
        } catch {
          req.body = {};
        }
        handled = true;
      } else if (typeof req.body === "string" && req.body.length > 0) {
      // Handle string JSON bodies
        try {
          if (contentType.includes("application/json")) {
            req.body = JSON.parse(req.body);
          }
        } catch {
          // Silently ignore JSON parse errors
        }
        handled = true;
      }

      if (handled) (req as any)._body = true;
      next();
    });

    // Standard JSON / urlencoded parsing for local dev. In Lambda these are
    // skipped because the custom handler above sets req._body = true.
    expApp.use(express.json({ limit: "50mb" }));
    expApp.use(express.urlencoded({ extended: true, limit: "50mb" }));
  };

  const server = app.setConfig(configFunction).build();
  return server;
};
