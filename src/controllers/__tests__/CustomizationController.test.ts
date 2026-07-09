import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: { getAll: (items: any[], key: string, value: any) => items.filter(i => i[key] === value) }
}));

import { CustomizationController } from "../CustomizationController";

describe("CustomizationController.getPublicForVenue", () => {
  it("serves anonymously and filters classroom-specific rows", async () => {
    const controller = new CustomizationController();
    let ranAnon = false;
    (controller as any).actionWrapperAnon = (_req: any, _res: any, action: any) => { ranAnon = true; return action(); };
    (controller as any).repositories = {
      customization: {
        loadByVenueId: jest.fn(async () => [
          { id: "all", classroomId: null },
          { id: "mine", classroomId: "cls1" },
          { id: "theirs", classroomId: "cls2" }
        ])
      }
    };

    const result = await (controller as any).getPublicForVenue("v1", "church1", { query: { classroomId: "cls1" } }, {});

    expect(ranAnon).toBe(true);
    expect((controller as any).repositories.customization.loadByVenueId).toHaveBeenCalledWith("church1", "v1");
    expect(result.map((c: any) => c.id)).toEqual(["all", "mine"]);
  });
});
