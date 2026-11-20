import "reflect-metadata";
jest.mock("../LessonsBaseController", () => ({
  LessonsBaseController: class {
    repositories: unknown;
    json(obj: unknown, status?: number) { return { obj, status: status ?? 200 }; }
  }
}));
const queueLessonDownload = jest.fn(async (..._args: unknown[]) => {});
jest.mock("../../helpers", () => ({
  __esModule: true,
  Environment: { hubspotKey: "" },
  MauticHelper: { queueLessonDownload: (...args: unknown[]) => queueLessonDownload(...args) }
}));
jest.mock("../../helpers/HubspotHelper", () => ({ HubspotHelper: { lookupCompanByChurchId: jest.fn(), setProperties: jest.fn() } }));

import { DownloadController } from "../DownloadController";
import { Download } from "../../models";
import { asRepositories, asRequest, noResponse, RepoMocks, setActionWrapper, TestUser } from "./controllerTestUtils";

function makeController(au: TestUser, repos: RepoMocks) {
  const controller = new DownloadController();
  setActionWrapper(controller, au);
  controller.repositories = asRepositories(repos);
  return controller;
}

function req(body: Download[]) {
  return asRequest({ body, headers: {}, socket: { remoteAddress: "1.2.3.4" } });
}

describe("DownloadController.save", () => {
  beforeEach(() => queueLessonDownload.mockClear());

  it("ignores a body churchId for another tenant", async () => {
    const saved: Download[] = [];
    const repos = { download: { save: jest.fn(async (d: Download) => { saved.push({ ...d }); return d; }), getDownloadCount: jest.fn() } };
    const au = { churchId: "c1", id: "u1" };
    const controller = makeController(au, repos);

    await controller.save(req([{ churchId: "OTHER", userId: "SPOOFED", lessonId: "l1" }]), noResponse);

    expect(saved[0].churchId).toBe("c1");
    expect(saved[0].userId).toBe("u1");
    expect(queueLessonDownload).toHaveBeenCalledWith("c1", "l1", au);
    expect(queueLessonDownload).not.toHaveBeenCalledWith("OTHER", expect.anything(), expect.anything());
  });
});
