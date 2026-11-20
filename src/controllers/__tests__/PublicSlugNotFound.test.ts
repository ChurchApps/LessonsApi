import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: { getAll: (items: Record<string, unknown>[], key: string, value: unknown) => items.filter(i => i[key] === value) },
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
import { LessonsBaseController } from "../LessonsBaseController";
import { asRepositories, asRequest, noResponse, RepoMocks, setActionWrapperAnon } from "./controllerTestUtils";

// A handler that resolves to undefined never writes a response, so the request hangs until the gateway times out.
const NOT_FOUND = {};

function make<T extends LessonsBaseController>(Ctor: new () => T, repos: RepoMocks): T {
  const controller = new Ctor();
  setActionWrapperAnon(controller);
  controller.repositories = asRepositories(repos);
  return controller;
}

const missing = jest.fn(async (): Promise<undefined> => undefined);

describe("public slug lookups answer when nothing matches", () => {
  it("program by slug", async () => {
    const controller = make(ProgramController, { program: { loadPublicBySlug: missing } });
    expect(await controller.getPublicBySlug("no-such-program", asRequest(), noResponse)).toEqual(NOT_FOUND);
  });

  it("study by slug", async () => {
    const controller = make(StudyController, { study: { loadPublicBySlug: missing } });
    expect(await controller.getPublicBySlug("PGM1", "no-such-study", asRequest(), noResponse)).toEqual(NOT_FOUND);
  });

  it("lesson by slugs when the program is missing", async () => {
    const repos = { program: { loadPublicBySlug: missing }, study: { loadPublicBySlug: missing }, lesson: { loadPublicBySlug: missing } };
    const controller = make(LessonController, repos);
    expect(await controller.getPublicBySlugAlt("no-such-program", "s", "l", asRequest(), noResponse)).toEqual(NOT_FOUND);
    expect(await controller.getPublicBySlug("no-such-program", "s", "l", asRequest(), noResponse)).toEqual(NOT_FOUND);
  });

  it("lesson by slugs when only the lesson is missing", async () => {
    const repos = {
      program: { loadPublicBySlug: jest.fn(async () => ({ id: "PGM1" })) },
      study: { loadPublicBySlug: jest.fn(async () => ({ id: "STU1" })) },
      lesson: { loadPublicBySlug: missing }
    };
    const controller = make(LessonController, repos);
    expect(await controller.getPublicBySlugAlt("p", "s", "no-such-lesson", asRequest(), noResponse)).toEqual(NOT_FOUND);
    expect(await controller.getPublicBySlug("p", "s", "no-such-lesson", asRequest(), noResponse)).toEqual(NOT_FOUND);
  });
});
