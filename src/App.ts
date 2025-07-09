import dotenv from "dotenv";
import "reflect-metadata";
import { Container } from "inversify";
import { InversifyExpressServer } from "inversify-express-utils";
import { bindings } from "./inversify.config";
import express from "express";
import { CustomAuthProvider } from "@churchapps/apihelper";
import cors from "cors"

export const init = async () => {
  dotenv.config();
  const container = new Container();
  await container.loadAsync(bindings);
  const app = new InversifyExpressServer(container, null, null, null, CustomAuthProvider);

  const configFunction = (expApp: express.Application) => {
    expApp.use(cors());
    
    // Custom body parsing middleware to handle serverless-express Buffer bodies
    expApp.use((req, res, next) => {
      if (req.body instanceof Buffer) {
        const bodyString = req.body.toString();
        if (req.headers['content-type']?.includes('application/json')) {
          try {
            req.body = JSON.parse(bodyString);
          } catch (e) {
            req.body = bodyString;
          }
        } else {
          req.body = bodyString;
        }
      } else if (req.body && typeof req.body === 'object' && req.body.type === 'Buffer' && Array.isArray(req.body.data)) {
        // Handle Buffer-like objects
        const buffer = Buffer.from(req.body.data);
        const bodyString = buffer.toString();
        if (req.headers['content-type']?.includes('application/json')) {
          try {
            req.body = JSON.parse(bodyString);
          } catch (e) {
            req.body = bodyString;
          }
        } else {
          req.body = bodyString;
        }
      } else if (typeof req.body === 'string' && req.headers['content-type']?.includes('application/json')) {
        // Handle string bodies that should be JSON
        try {
          req.body = JSON.parse(req.body);
        } catch (e) {
          // Keep as string if parsing fails
        }
      }
      next();
    });
    
    // Standard express body parsing as fallback
    expApp.use(express.urlencoded({ extended: true }));
    expApp.use(express.json({ limit: "50mb" }));
  };

  const server = app.setConfig(configFunction).build();
  return server;
}
