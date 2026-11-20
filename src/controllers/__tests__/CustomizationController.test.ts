import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: { getAll: (items: Record<string, unknown>[], key: string, value: unknown) => items.filter(i => i[key] === value) }
}));

import { CustomizationController } from "../CustomizationController";
import { Customization } from "../../models";
import { AnonControllerAction, asRepositories, asRequest, noResponse } from "./controllerTestUtils";

describe("CustomizationController.getPublicForVenue", () => {
  it("serves anonymously and filters classroom-specific rows", async () => {
    const controller = new CustomizationController();
    let ranAnon = false;
    controller.actionWrapperAnon = (_req, _res, action: AnonControllerAction) => { ranAnon = true; return action() as Promise<unknown>; };
    const loadByVenueId = jest.fn(async () => [
      { id: "all", classroomId: null },
      { id: "mine", classroomId: "cls1" },
      { id: "theirs", classroomId: "cls2" }
    ]);
    controller.repositories = asRepositories({ customization: { loadByVenueId } });

    const result = await controller.getPublicForVenue("v1", "church1", asRequest({ query: { classroomId: "cls1" } }), noResponse) as Customization[];

    expect(ranAnon).toBe(true);
    expect(loadByVenueId).toHaveBeenCalledWith("church1", "v1");
    expect(result.map(c => c.id)).toEqual(["all", "mine"]);
  });
});
