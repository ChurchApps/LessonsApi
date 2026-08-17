import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: any;
    json(obj: any, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
jest.mock("../../helpers", () => ({
  __esModule: true,
  Permissions: { lessons: { edit: "lessons.edit" } },
  FilesHelper: { deleteBundleFolder: jest.fn(), deleteFile: jest.fn(), deleteResourceFolder: jest.fn() }
}));
jest.mock("../../helpers/ZipHelper", () => ({ ZipHelper: { zipPendingBundles: jest.fn(async () => {}), setBundlePending: jest.fn(async () => {}) } }));

import { BundleController } from "../BundleController";
import { ZipHelper } from "../../helpers/ZipHelper";

function makeController(au: any, repos: any) {
  const controller = new BundleController();
  (controller as any).actionWrapper = (_req: any, _res: any, action: any) => action(au);
  (controller as any).repositories = repos;
  return controller;
}

describe("BundleController.zipAll", () => {
  it("rejects users without lessons-edit permission", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => false }, {});

    const res = await (controller as any).zipAll({}, {});

    expect(res.status).toBe(401);
    expect(ZipHelper.zipPendingBundles).not.toHaveBeenCalled();
  });

  it("zips only the caller's church pending bundles", async () => {
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, {});

    await (controller as any).zipAll({}, {});

    expect(ZipHelper.zipPendingBundles).toHaveBeenCalledWith("c1");
  });
});

describe("BundleController.clearStuckBundles", () => {
  it("clears only the caller's church stuck bundles", async () => {
    const hourAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const ownStuck = { id: "b1", churchId: "c1", pendingUpdate: true, dateModified: hourAgo };
    const save = jest.fn(async (b: any) => b);
    const loadPendingUpdate = jest.fn(async () => [ownStuck]);
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, { bundle: { loadPendingUpdate, save } });

    const res = await (controller as any).clearStuckBundles({}, {});

    expect(loadPendingUpdate).toHaveBeenCalledWith(100, "c1");
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ id: "b1", churchId: "c1", pendingUpdate: false }));
    expect(res.clearedBundleIds).toEqual(["b1"]);
  });

  it("does not load or clear another church's zip jobs", async () => {
    const loadPendingUpdate = jest.fn(async (_limit: number, churchId?: string) => {
      expect(churchId).toBe("c1");
      return [];
    });
    const save = jest.fn();
    const controller = makeController({ churchId: "c1", checkAccess: () => true }, { bundle: { loadPendingUpdate, save } });

    const res = await (controller as any).clearStuckBundles({}, {});

    expect(loadPendingUpdate).toHaveBeenCalledWith(100, "c1");
    expect(save).not.toHaveBeenCalled();
    expect(res.clearedCount).toBe(0);
  });
});
