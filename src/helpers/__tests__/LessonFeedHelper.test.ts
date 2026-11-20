jest.mock("../../repositories", () => ({ Repositories: { getCurrent: jest.fn() } }));
jest.mock("@churchapps/apihelper", () => ({
  __esModule: true,
  ArrayHelper: {
    getIds: (items: Record<string, unknown>[], key: string) => Array.from(new Set(items.filter(i => i[key]).map(i => i[key]))),
    getAll: (items: Record<string, unknown>[], key: string, value: unknown) => items.filter(i => i[key] === value),
    getOne: (items: Record<string, unknown>[], key: string, value: unknown) => (items || []).find(i => i[key] === value)
  }
}));

import { LessonFeedHelper } from "../LessonFeedHelper";
import { Lesson, Program, Study, Venue } from "../../models";

const takeHome = {
  bottomLine: "God keeps His promises.",
  verse: "Genesis 9:13 — I have set my rainbow in the clouds…",
  parentQuestion: "What is one promise God has kept?",
  parentNote: "Pray together."
};

function convert(lessonOverrides: Record<string, unknown> = {}) {
  return LessonFeedHelper.convertToFeed(
    { id: "l1", title: "The Rainbow", description: "Catalog copy about Noah.", image: "https://img", ...lessonOverrides } as Lesson,
    { name: "The Beginning", slug: "the-beginning" } as Study,
    { name: "Gospel of Mark", slug: "gospel-of-mark", aboutSection: "A study." } as Program,
    { id: "v1", name: "Kids", sections: [] } as Venue,
    [],
    [],
    [],
    []
  );
}

describe("LessonFeedHelper.convertToFeed take-home", () => {
  it("copies the four parent take-home fields onto FeedVenue", () => {
    const feed = convert(takeHome);
    expect(feed.bottomLine).toBe(takeHome.bottomLine);
    expect(feed.verse).toBe(takeHome.verse);
    expect(feed.parentQuestion).toBe(takeHome.parentQuestion);
    expect(feed.parentNote).toBe(takeHome.parentNote);
    expect(feed.lessonDescription).toBe("Catalog copy about Noah.");
  });

  it("leaves take-home empty when missing and does not copy description", () => {
    const feed = convert();
    expect(feed.bottomLine).toBeUndefined();
    expect(feed.verse).toBeUndefined();
    expect(feed.parentQuestion).toBeUndefined();
    expect(feed.parentNote).toBeUndefined();
    expect(feed.lessonDescription).toBe("Catalog copy about Noah.");
  });
});
