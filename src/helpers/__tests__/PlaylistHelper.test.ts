jest.mock("../../repositories", () => ({ Repositories: { getCurrent: jest.fn() } }));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: {
    getIds: (items: any[], key: string) => Array.from(new Set(items.filter(i => i[key]).map(i => i[key]))),
    getAll: (items: any[], key: string, value: any) => items.filter(i => i[key] === value)
  }
}));

import { PlaylistHelper } from "../PlaylistHelper";
import { Repositories } from "../../repositories";
import { Action } from "../../models";

describe("PlaylistHelper.getBestFiles", () => {
  it("prefers webm over mp4 over images", () => {
    const action: Action = { assetId: "a1" };
    const files = [
      { assetId: "a1", fileType: "image/jpeg" },
      { assetId: "a1", fileType: "video/mp4" },
      { assetId: "a1", fileType: "video/webm" }
    ];
    const best = PlaylistHelper.getBestFiles(action, files);
    expect(best).toHaveLength(1);
    expect(best[0].fileType).toBe("video/webm");
  });

  it("falls back to resource files when the action has no asset", () => {
    const action: Action = { resourceId: "r1" };
    const files = [{ resourceId: "r1", fileType: "video/mp4" }];
    expect(PlaylistHelper.getBestFiles(action, files)).toHaveLength(1);
  });

  it("returns all asset files of a resource when no assetId and asset files exist", () => {
    const action: Action = { resourceId: "r1" };
    const files = [
      { resourceId: "r1", assetId: "a1", fileType: "video/mp4" },
      { resourceId: "r1", assetId: "a2", fileType: "video/mp4" }
    ];
    expect(PlaylistHelper.getBestFiles(action, files)).toHaveLength(2);
  });

  it("returns [] when no file has a preferred type", () => {
    const action: Action = { assetId: "a1" };
    expect(PlaylistHelper.getBestFiles(action, [{ assetId: "a1", fileType: "application/pdf" }])).toEqual([]);
  });
});

describe("PlaylistHelper.loadPlaylistVideos", () => {
  it("merges lesson videos with add-on videos", async () => {
    const repo = {
      externalVideo: {
        loadByIds: jest.fn(async () => [{ id: "v1" }]),
        loadByContentTypeIds: jest.fn(async () => [{ id: "v2" }])
      }
    };
    (Repositories.getCurrent as jest.Mock).mockReturnValue(repo);

    const actions: Action[] = [{ externalVideoId: "v1" }, { addOnId: "ao1" }];
    const videos = await PlaylistHelper.loadPlaylistVideos(actions);

    expect(videos.map((v: any) => v.id)).toEqual(["v1", "v2"]);
    expect(repo.externalVideo.loadByContentTypeIds).toHaveBeenCalledWith("addOn", ["ao1"]);
  });
});
