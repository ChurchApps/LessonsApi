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
jest.mock("../../helpers/LessonFeedHelper", () => ({ LessonFeedHelper: {} }));
jest.mock("../../helpers/VimeoHelper", () => ({ VimeoHelper: {} }));
jest.mock("../../helpers/Permissions", () => ({ Permissions: { lessons: { edit: "lessons.edit" } } }));

import { LessonController } from "../LessonController";

const takeHome = {
  bottomLine: "God keeps His promises.",
  verse: "Genesis 9:13",
  parentQuestion: "What promise did God keep?",
  parentNote: "Pray together."
};

function makeController(repos: any) {
  const controller = new LessonController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action({ churchId: "c1", checkAccess: () => true });
  (controller as any).actionWrapperAnon = (_req: any, _res: any, action: any) => action();
  (controller as any).repositories = repos;
  return controller;
}

describe("LessonController.save", () => {
  it("persists parent take-home fields on the lesson", async () => {
    const saved: any[] = [];
    const controller = makeController({ lesson: { save: jest.fn(async (l: any) => { saved.push(l); return l; }) } });

    await (controller as any).save({ body: [{ churchId: "SPOOFED", name: "Creation", ...takeHome }] }, {});

    expect(saved[0].churchId).toBe("c1");
    expect(saved[0]).toEqual(expect.objectContaining(takeHome));
  });
});

describe("LessonController.getPublicForProgram", () => {
  it("includes take-home fields on each lesson in the public tree", async () => {
    const controller = makeController({
      program: { loadPublicAll: jest.fn(async () => [{ id: "p1", name: "P", shortDescription: "about" }]) },
      study: { loadPublicAll: jest.fn(async () => [{ id: "s1", programId: "p1", name: "S", shortDescription: "s" }]) },
      lesson: { loadPublicAll: jest.fn(async () => [{ id: "l1", studyId: "s1", name: "Week 1", title: "The Rainbow", description: "Catalog copy", image: "img", ...takeHome }]) },
      venue: { loadPublicAll: jest.fn(async () => [{ id: "v1", lessonId: "l1", name: "Kids" }]) }
    });

    const result = await (controller as any).getPublicForProgram({ query: {} }, {});
    const lesson = result.programs[0].studies[0].lessons[0];

    expect(lesson).toEqual(expect.objectContaining({ id: "l1", description: "Catalog copy", ...takeHome }));
    expect(lesson.venues[0].id).toBe("v1");
  });
});
