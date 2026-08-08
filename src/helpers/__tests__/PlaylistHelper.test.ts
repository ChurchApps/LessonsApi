jest.mock("../../repositories", () => ({ Repositories: { getCurrent: jest.fn() } }));
jest.mock("../VimeoHelper", () => ({ VimeoHelper: { updateVimeoLinks: jest.fn(async (ev: any) => ev) } }));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: {
    getIds: (items: any[], key: string) => Array.from(new Set(items.filter(i => i[key]).map(i => i[key]))),
    getAll: (items: any[], key: string, value: any) => items.filter(i => i[key] === value)
  }
}));

import { PlaylistHelper } from "../PlaylistHelper";
import { Repositories } from "../../repositories";
import { VimeoHelper } from "../VimeoHelper";
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

  it("refreshes expired Vimeo links and leaves fresh ones alone", async () => {
    const future = new Date(Date.now() + 3600000);
    const past = new Date(Date.now() - 3600000);
    const repo = {
      externalVideo: {
        loadByIds: jest.fn(async () => [
          { id: "expired", videoProvider: "Vimeo", downloadsExpire: past },
          { id: "fresh", videoProvider: "Vimeo", downloadsExpire: future },
          { id: "noDate", videoProvider: "Vimeo" },
          { id: "youtube", videoProvider: "YouTube", downloadsExpire: past }
        ]),
        loadByContentTypeIds: jest.fn(async () => [])
      }
    };
    (Repositories.getCurrent as jest.Mock).mockReturnValue(repo);
    (VimeoHelper.updateVimeoLinks as jest.Mock).mockClear();

    const actions: Action[] = [{ externalVideoId: "any" }];
    await PlaylistHelper.loadPlaylistVideos(actions);

    const refreshed = (VimeoHelper.updateVimeoLinks as jest.Mock).mock.calls.map(c => c[0].id).sort();
    expect(refreshed).toEqual(["expired", "noDate"]);
  });

  it("serves stale links when a Vimeo refresh fails", async () => {
    const past = new Date(Date.now() - 3600000);
    const repo = {
      externalVideo: {
        loadByIds: jest.fn(async () => [{ id: "expired", videoProvider: "vimeo", downloadsExpire: past, play720: "stale" }]),
        loadByContentTypeIds: jest.fn(async () => [])
      }
    };
    (Repositories.getCurrent as jest.Mock).mockReturnValue(repo);
    (VimeoHelper.updateVimeoLinks as jest.Mock).mockRejectedValueOnce(new Error("vimeo down"));

    const videos = await PlaylistHelper.loadPlaylistVideos([{ externalVideoId: "any" }]);
    expect(videos[0].play720).toBe("stale");
  });
});
