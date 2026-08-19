jest.mock("../../repositories", () => ({ Repositories: { getCurrent: jest.fn() } }));
jest.mock("../ProviderUrlHelper", () => ({
  fetchProviderJson: jest.fn(),
  providerHostname: (url: string) => new URL(url).hostname
}));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: { getOne: (items: any[], key: string, value: any) => (items || []).find((i: any) => i[key] === value) }
}));

import { ExternalProviderHelper } from "../ExternalProviderHelper";
import { Repositories } from "../../repositories";
import { fetchProviderJson } from "../ProviderUrlHelper";

const fetchJson = fetchProviderJson as jest.Mock;

const tree = {
  programs: [
    {
      id: "p1",
      studies: [
        {
          id: "s1",
          lessons: [
            {
              id: "l1",
              venues: [{ id: "v1", name: "Kids", apiUrl: "https://api.lessons.church/venues/public/feed/v1" }]
            }
          ]
        }
      ]
    }
  ]
};

describe("ExternalProviderHelper.loadExternalData", () => {
  beforeEach(() => {
    fetchJson.mockReset();
    (Repositories.getCurrent as jest.Mock).mockReturnValue({ externalProvider: { loadPublic: jest.fn(async () => ({ id: "ep1", apiUrl: "https://api.lessons.church/lessons/public/tree" })) } });
  });

  it("loads the tree then the venue feed on the provider host", async () => {
    fetchJson.mockResolvedValueOnce(tree).mockResolvedValueOnce({ lessonName: "Creation" });
    const result = await ExternalProviderHelper.loadExternalData("ep1", "p1", "s1", "l1", "v1");
    expect(result.lessonName).toBe("Creation");
    expect(fetchJson).toHaveBeenNthCalledWith(1, "https://api.lessons.church/lessons/public/tree");
    expect(fetchJson).toHaveBeenNthCalledWith(2, "https://api.lessons.church/venues/public/feed/v1", ["api.lessons.church"]);
  });

  it("does not fetch a venue URL when the tree request is rejected", async () => {
    fetchJson.mockRejectedValueOnce(new Error("Provider URL host is not allowed"));
    await expect(ExternalProviderHelper.loadExternalData("ep1", "p1", "s1", "l1", "v1")).rejects.toThrow("not allowed");
    expect(fetchJson).toHaveBeenCalledTimes(1);
  });

  it("maps take-home from the venue feed when present", async () => {
    fetchJson.mockResolvedValueOnce(tree).mockResolvedValueOnce({
      lessonName: "Creation",
      lessonDescription: "Catalog copy",
      bottomLine: "God keeps His promises.",
      verse: "Genesis 9:13",
      parentQuestion: "What promise did God keep?",
      parentNote: "Pray together."
    });
    const result = await ExternalProviderHelper.loadExternalData("ep1", "p1", "s1", "l1", "v1");
    expect(result.bottomLine).toBe("God keeps His promises.");
    expect(result.verse).toBe("Genesis 9:13");
    expect(result.parentQuestion).toBe("What promise did God keep?");
    expect(result.parentNote).toBe("Pray together.");
    expect(result.lessonDescription).toBe("Catalog copy");
  });

  it("maps take-home from the tree lesson when the feed omits them", async () => {
    const treeWithTakeHome = {
      programs: [
        {
          id: "p1",
          studies: [
            {
              id: "s1",
              lessons: [
                {
                  id: "l1",
                  description: "Catalog copy",
                  bottomLine: "From the tree.",
                  verse: "John 3:16",
                  venues: [{ id: "v1", name: "Kids", apiUrl: "https://api.lessons.church/venues/public/feed/v1" }]
                }
              ]
            }
          ]
        }
      ]
    };
    fetchJson.mockResolvedValueOnce(treeWithTakeHome).mockResolvedValueOnce({ lessonName: "Creation", lessonDescription: "Catalog copy" });
    const result = await ExternalProviderHelper.loadExternalData("ep1", "p1", "s1", "l1", "v1");
    expect(result.bottomLine).toBe("From the tree.");
    expect(result.verse).toBe("John 3:16");
    expect(result.parentQuestion).toBeUndefined();
    expect(result.parentNote).toBeUndefined();
  });

  it("does not invent take-home from description", async () => {
    const treeWithDescription = {
      programs: [
        {
          id: "p1",
          studies: [
            {
              id: "s1",
              lessons: [
                {
                  id: "l1",
                  description: "An introduction to Jesus' ministry.",
                  venues: [{ id: "v1", name: "Kids", apiUrl: "https://api.lessons.church/venues/public/feed/v1" }]
                }
              ]
            }
          ]
        }
      ]
    };
    fetchJson.mockResolvedValueOnce(treeWithDescription).mockResolvedValueOnce({ lessonName: "Creation", lessonDescription: "An introduction to Jesus' ministry." });
    const result = await ExternalProviderHelper.loadExternalData("ep1", "p1", "s1", "l1", "v1");
    expect(result.bottomLine).toBeUndefined();
    expect(result.verse).toBeUndefined();
    expect(result.parentQuestion).toBeUndefined();
    expect(result.parentNote).toBeUndefined();
    expect(result.lessonDescription).toBe("An introduction to Jesus' ministry.");
  });
});

describe("ExternalProviderHelper.convertToMessages", () => {
  it("passes take-home through and does not copy description", () => {
    const result = ExternalProviderHelper.convertToMessages({
      lessonName: "Creation",
      lessonDescription: "Catalog copy",
      bottomLine: "God keeps His promises.",
      verse: "Genesis 9:13",
      parentQuestion: "Q?",
      parentNote: "Pray.",
      sections: []
    });
    expect(result.bottomLine).toBe("God keeps His promises.");
    expect(result.verse).toBe("Genesis 9:13");
    expect(result.parentQuestion).toBe("Q?");
    expect(result.parentNote).toBe("Pray.");
    expect(result.lessonDescription).toBe("Catalog copy");
  });
});

describe("ExternalProviderHelper.mergeTakeHome", () => {
  it("prefers feed fields over the tree lesson", () => {
    const merged = ExternalProviderHelper.mergeTakeHome(
      { bottomLine: "From feed", description: "catalog" },
      { bottomLine: "From tree", verse: "John 3:16", description: "catalog" }
    );
    expect(merged.bottomLine).toBe("From feed");
    expect(merged.verse).toBe("John 3:16");
  });
});
