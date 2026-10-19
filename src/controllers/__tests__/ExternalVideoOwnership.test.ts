import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({ __esModule: true }));
jest.mock("../../helpers/VimeoHelper", () => ({ VimeoHelper: {} }));
jest.mock("../../helpers/Permissions", () => ({ Permissions: { lessons: { edit: "lessons.edit" } } }));

import { ExternalVideoController } from "../ExternalVideoController";

const au = { churchId: "c1", checkAccess: () => true };

function make() {
  const save = jest.fn(async (x: any) => x);
  const controller: any = new ExternalVideoController();
  controller.actionWrapper = (_req: any, _res: any, action: any) => action(au);
  controller.repositories = {
    lesson: { load: jest.fn(async (churchId: string, id: string) => (churchId === "c1" && id === "l1" ? { id, churchId } : undefined)) },
    addOn: { load: jest.fn(async (id: string) => (id === "a1" ? { id, churchId: "c1" } : id === "aOther" ? { id, churchId: "c2" } : undefined)) },
    externalVideo: { save }
  };
  return { controller, save };
}

describe("ExternalVideoController.save ownership", () => {
  it("rejects a video attached to another church's add-on", async () => {
    const { controller, save } = make();
    const result = await controller.save({ body: [{ contentType: "addOn", contentId: "aOther" }] }, {});
    expect(result.status).toBe(404);
    expect(save).not.toHaveBeenCalled();
  });

  it("saves videos attached to the caller's own content", async () => {
    const { controller, save } = make();
    await controller.save({ body: [{ contentType: "addOn", contentId: "a1" }, { contentType: "lesson", contentId: "l1" }] }, {});
    expect(save).toHaveBeenCalledTimes(2);
  });
});
