import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: { getAll: (items: any[], key: string, value: any) => items.filter(i => i[key] === value) },
  EnvironmentBase: class {},
  AwsHelper: {},
  FileStorageHelper: { store: jest.fn(), remove: jest.fn() }
}));
jest.mock("../../helpers", () => ({ __esModule: true, Environment: { contentRoot: "" }, FileStorageHelper: { store: jest.fn(), remove: jest.fn() } }));
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: { getExpandedLessonData: jest.fn() } }));
jest.mock("../../helpers/VimeoHelper", () => ({ VimeoHelper: {} }));
jest.mock("../../helpers/LibraryHelper", () => ({ LibraryHelper: {} }));
jest.mock("../../helpers/Permissions", () => ({ Permissions: { lessons: { edit: "lessons.edit" } } }));

import { ProgramController } from "../ProgramController";
import { StudyController } from "../StudyController";
import { LessonController } from "../LessonController";

// A handler that resolves to undefined never writes a response, so the request hangs until the gateway times out.
const NOT_FOUND = {};

function make<T>(Ctor: new () => T, repos: any): T {
  const controller: any = new Ctor();
  controller.actionWrapperAnon = (_req: any, _res: any, action: any) => action();
  controller.repositories = repos;
  return controller;
}

const missing = jest.fn(async (): Promise<any> => undefined);

describe("public slug lookups answer when nothing matches", () => {
  it("program by slug", async () => {
    const controller: any = make(ProgramController, { program: { loadPublicBySlug: missing } });
    expect(await controller.getPublicBySlug("no-such-program", {}, {})).toEqual(NOT_FOUND);
  });

  it("study by slug", async () => {
    const controller: any = make(StudyController, { study: { loadPublicBySlug: missing } });
    expect(await controller.getPublicBySlug("PGM1", "no-such-study", {}, {})).toEqual(NOT_FOUND);
  });

  it("lesson by slugs when the program is missing", async () => {
    const repos = { program: { loadPublicBySlug: missing }, study: { loadPublicBySlug: missing }, lesson: { loadPublicBySlug: missing } };
    const controller: any = make(LessonController, repos);
    expect(await controller.getPublicBySlugAlt("no-such-program", "s", "l", {}, {})).toEqual(NOT_FOUND);
    expect(await controller.getPublicBySlug("no-such-program", "s", "l", {}, {})).toEqual(NOT_FOUND);
  });

  it("lesson by slugs when only the lesson is missing", async () => {
    const repos = {
      program: { loadPublicBySlug: jest.fn(async () => ({ id: "PGM1" })) },
      study: { loadPublicBySlug: jest.fn(async () => ({ id: "STU1" })) },
      lesson: { loadPublicBySlug: missing }
    };
    const controller: any = make(LessonController, repos);
    expect(await controller.getPublicBySlugAlt("p", "s", "no-such-lesson", {}, {})).toEqual(NOT_FOUND);
    expect(await controller.getPublicBySlug("p", "s", "no-such-lesson", {}, {})).toEqual(NOT_FOUND);
  });
});
