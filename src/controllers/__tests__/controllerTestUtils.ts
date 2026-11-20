import express from "express";
import { AuthenticatedUser } from "@churchapps/apihelper";
import { Repositories } from "../../repositories";
import { LessonsBaseController } from "../LessonsBaseController";

// A stand-in for Repositories: each repository holds only the methods (usually jest mocks) a test needs.
export type RepoMocks = { [K in keyof Repositories]?: Partial<Record<keyof Repositories[K], (...args: never[]) => unknown>> };

// The parts of an express request the controllers under test read.
export interface RequestFixture {
  body?: unknown;
  query?: Record<string, unknown>;
  headers?: Record<string, unknown>;
  socket?: { remoteAddress?: string };
}

// The user handed to actionWrapper; tests only fill in what the controller reads.
export type TestUser = Partial<AuthenticatedUser>;

// What the mocked LessonsBaseController.json returns.
export interface JsonResult {
  obj: unknown;
  status: number;
}

export const asRepositories = (repos: RepoMocks) => repos as Repositories;
export const asUser = (au: TestUser) => au as AuthenticatedUser;
export const asRequest = (req: RequestFixture = {}) => req as express.Request;
export const noResponse = {} as express.Response;

export type ControllerAction = (au: AuthenticatedUser) => unknown;
export type AnonControllerAction = () => unknown;

export function setActionWrapper(controller: LessonsBaseController, au: TestUser) {
  controller.actionWrapper = (_req: express.Request, _res: express.Response, action: ControllerAction) => action(asUser(au)) as Promise<unknown>;
}

export function setActionWrapperAnon(controller: LessonsBaseController) {
  controller.actionWrapperAnon = (_req: express.Request, _res: express.Response, action: AnonControllerAction) => action() as Promise<unknown>;
}
