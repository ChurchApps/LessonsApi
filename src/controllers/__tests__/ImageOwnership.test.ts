import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: {},
  EnvironmentBase: class {},
  AwsHelper: {},
  FileStorageHelper: { store: jest.fn(async () => {}), remove: jest.fn(async () => {}) }
}));
jest.mock("../../helpers", () => {
  const { FileStorageHelper } = jest.requireMock("@churchapps/apihelper");
  return { __esModule: true, Environment: { contentRoot: "" }, FileStorageHelper };
});
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: {} }));
jest.mock("../../helpers/LibraryHelper", () => ({ LibraryHelper: {} }));
jest.mock("../../helpers/VimeoHelper", () => ({ VimeoHelper: {} }));
jest.mock("../../helpers/Permissions", () => ({ Permissions: { lessons: { edit: "lessons.edit" } } }));

import { FileStorageHelper } from "@churchapps/apihelper";
import { LessonController } from "../LessonController";
import { StudyController } from "../StudyController";
import { ProgramController } from "../ProgramController";
import { AddOnController } from "../AddOnController";
import express from "express";
import { LessonsBaseController } from "../LessonsBaseController";
import { asRepositories, asRequest, JsonResult, noResponse, RepoMocks, setActionWrapper } from "./controllerTestUtils";

// The controllers under test all save and delete records that carry an image.
type ImageController = LessonsBaseController & {
  save: (req: express.Request, res: express.Response) => Promise<unknown>;
  delete: (id: string, req: express.Request, res: express.Response) => Promise<unknown>;
};

const image = "data:image/png;base64,AAAA";

function makeController(ControllerClass: new () => ImageController, repos: RepoMocks) {
  const controller = new ControllerClass();
  setActionWrapper(controller, { churchId: "c1", checkAccess: () => true });
  controller.repositories = asRepositories(repos);
  return controller;
}

// Repos where "own" belongs to church c1 and "victim" belongs to another church.
function churchScopedRepo() {
  return {
    load: jest.fn(async (churchId: string, id: string) => (churchId === "c1" && id === "own" ? { id, churchId } : undefined)),
    save: jest.fn(async <T>(x: T) => x),
    delete: jest.fn(async () => {}),
    loadByStudyId: jest.fn(async () => []),
    loadByProgramId: jest.fn(async () => [])
  };
}

function addOnRepo() {
  return {
    load: jest.fn(async (id: string) => ({ own: { id, churchId: "c1" }, victim: { id, churchId: "c2" } } as Record<string, { id: string; churchId: string }>)[id]),
    save: jest.fn(async <T>(x: T) => x),
    delete: jest.fn(async () => {})
  };
}

function makeRepos() {
  return {
    lesson: churchScopedRepo(),
    study: churchScopedRepo(),
    program: churchScopedRepo(),
    addOn: addOnRepo(),
    resource: { loadByContentTypeId: jest.fn(async () => []) }
  };
}

const cases = [
  { name: "lesson", Controller: LessonController, folder: "lessons" },
  { name: "study", Controller: StudyController, folder: "studies" },
  { name: "program", Controller: ProgramController, folder: "programs" },
  { name: "addOn", Controller: AddOnController, folder: "addOns" }
];

describe("image writes only touch the church's own content", () => {
  beforeEach(() => {
    (FileStorageHelper.store as jest.Mock).mockClear();
    (FileStorageHelper.remove as jest.Mock).mockClear();
  });

  it.each(cases)("$name save refuses to replace another church's image", async ({ Controller, folder }) => {
    const controller = makeController(Controller, makeRepos());

    const res = await controller.save(asRequest({ body: [{ id: "victim", image }] }), noResponse) as JsonResult;

    expect(res.status).toBe(404);
    expect(FileStorageHelper.store).not.toHaveBeenCalledWith("/" + folder + "/victim.png", expect.anything(), expect.anything());
  });

  it.each(cases)("$name save still replaces the church's own image", async ({ Controller, folder }) => {
    const controller = makeController(Controller, makeRepos());

    await controller.save(asRequest({ body: [{ id: "own", image }] }), noResponse);

    expect(FileStorageHelper.store).toHaveBeenCalledWith("/" + folder + "/own.png", "image/png", expect.any(Buffer));
  });

  it.each(cases.filter((c) => c.name !== "addOn"))("$name delete leaves another church's image alone", async ({ Controller, folder }) => {
    const controller = makeController(Controller, makeRepos());

    const res = await controller.delete("victim", asRequest(), noResponse) as JsonResult;

    expect(res.status).toBe(404);
    expect(FileStorageHelper.remove).not.toHaveBeenCalledWith("/" + folder + "/victim.png");
  });

  it.each(cases.filter((c) => c.name !== "addOn"))("$name delete still removes the church's own image", async ({ Controller, folder }) => {
    const controller = makeController(Controller, makeRepos());

    await controller.delete("own", asRequest(), noResponse);

    expect(FileStorageHelper.remove).toHaveBeenCalledWith("/" + folder + "/own.png");
  });
});
