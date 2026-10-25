import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: { getAll: (items: any[], key: string, value: any) => items.filter(i => i[key] === value), getOne: () => null },
  EnvironmentBase: class {},
  AwsHelper: {},
  FileStorageHelper: { store: jest.fn(), remove: jest.fn() }
}));
jest.mock("../../helpers", () => ({ __esModule: true, Environment: { contentRoot: "" }, FileStorageHelper: { store: jest.fn(), remove: jest.fn() }, DurationHelper: {}, MauticHelper: {} }));
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: { getExpandedLessonData: jest.fn() } }));
jest.mock("../../helpers/VimeoHelper", () => ({ VimeoHelper: {} }));
jest.mock("../../helpers/LibraryHelper", () => ({ LibraryHelper: {} }));
jest.mock("../../helpers/PlaylistHelper", () => ({ PlaylistHelper: {} }));
jest.mock("../../helpers/ExternalProviderHelper", () => ({ ExternalProviderHelper: {} }));
jest.mock("../../helpers/Permissions", () => ({ Permissions: { lessons: { edit: "lessons.edit" } } }));

import { VenueController } from "../VenueController";
import { LessonController } from "../LessonController";
import { ClassroomController } from "../ClassroomController";

// Prod 2026-10-15: 164 "Cannot read properties of undefined (reading 'lessonId' | 'studyId')" 500s from
// /venues/public/* and /lessons/public/:id when the id matched nothing. An unknown id is a 404.
function make<T>(Ctor: new () => T, repos: any): T {
  const controller: any = new Ctor();
  controller.actionWrapperAnon = (_req: any, _res: any, action: any) => action();
  controller.repositories = repos;
  return controller;
}

const missing = jest.fn(async (): Promise<any> => undefined);
const req = { query: {}, headers: {}, socket: { remoteAddress: "127.0.0.1" } };

describe("public id lookups answer 404 when nothing matches", () => {
  it("venue by id", async () => {
    const controller: any = make(VenueController, { venue: { loadPublic: missing } });
    expect((await controller.getPublic("no-such-venue", req, {})).status).toBe(404);
  });

  it("venue feed by id", async () => {
    const controller: any = make(VenueController, { venue: { loadPublic: missing } });
    expect((await controller.getPublicFeed("no-such-venue", req, {})).status).toBe(404);
  });

  it("venue actions by id", async () => {
    const controller: any = make(VenueController, { venue: { loadPublic: missing }, section: { loadByVenueIdPublic: jest.fn(async () => []) } });
    expect((await controller.getPublicActions("no-such-venue", req, {})).status).toBe(404);
  });

  it("lesson by id", async () => {
    const controller: any = make(LessonController, { lesson: { loadPublic: missing } });
    expect((await controller.getPublic("no-such-lesson", req, {})).status).toBe(404);
  });

  it("lesson whose study is gone", async () => {
    const repos = { lesson: { loadPublic: jest.fn(async () => ({ id: "L1", studyId: "gone" })) }, study: { loadPublic: missing } };
    const controller: any = make(LessonController, repos);
    expect((await controller.getPublic("L1", req, {})).status).toBe(404);
  });
});

// ~40/day "Could not load schedule" 500s: a classroom player polling with nothing scheduled is a 404, not an error.
describe("classroom playlist with no current schedule", () => {
  it("getPlaylist answers 404", async () => {
    const controller: any = make(ClassroomController, { schedule: { loadCurrent: jest.fn(async () => null) } });
    expect((await controller.getPlaylist("room1", req, {})).status).toBe(404);
  });

  it("getPlaylistNew answers 404", async () => {
    const controller: any = make(ClassroomController, { schedule: { loadCurrent: jest.fn(async () => null) } });
    expect((await controller.getPlaylistNew("room1", req, {})).status).toBe(404);
  });
});

// Prod 2026-10-23/24: 135 "reading 'lessonId'" 500s from VenueController's playlist routes when the venue id matched nothing.
describe("venue playlist with an unknown venue id", () => {
  it("getPlaylist answers 404", async () => {
    const controller: any = make(VenueController, { venue: { loadPublic: missing }, lesson: { loadPublic: missing } });
    expect((await controller.getPlaylist("no-such-venue", req, {})).status).toBe(404);
  });

  it("getPlaylistNew answers 404", async () => {
    const controller: any = make(VenueController, { venue: { loadPublic: missing }, lesson: { loadPublic: missing } });
    expect((await controller.getPlaylistNew("no-such-venue", req, {})).status).toBe(404);
  });

  it("getPlaylist answers 404 when the venue's lesson is gone", async () => {
    const controller: any = make(VenueController, { venue: { loadPublic: jest.fn(async () => ({ id: "v1", lessonId: "gone", churchId: "c1" })) }, lesson: { loadPublic: missing } });
    expect((await controller.getPlaylist("v1", req, {})).status).toBe(404);
  });
});
