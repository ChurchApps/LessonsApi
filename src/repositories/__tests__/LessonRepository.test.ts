jest.mock("../../db", () => ({ getDb: jest.fn() }));
jest.mock("../../helpers", () => ({
  __esModule: true,
  UniqueIdHelper: { shortId: () => "lesson_gen", isMissing: (id?: string) => !id }
}));

import { getDb } from "../../db";
import { LessonRepository } from "../LessonRepository";
import { Lesson } from "../../models";

const mockedGetDb = getDb as jest.Mock;

describe("LessonRepository.save", () => {
  it("creates with a generated id and churchId", async () => {
    const values = jest.fn().mockReturnValue({ execute: () => Promise.resolve() });
    mockedGetDb.mockReturnValue({ insertInto: () => ({ values }) });

    const lesson = await new LessonRepository().save({ churchId: "c1", studyId: "st1", name: "Creation" } as Lesson);

    expect(lesson.id).toBe("lesson_gen");
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ id: "lesson_gen", churchId: "c1", studyId: "st1" }));
  });

  it("updates scoped to id and churchId", async () => {
    const wheres: any[] = [];
    const chain: any = { where: (...args: any[]) => { wheres.push(args); return chain; }, execute: () => Promise.resolve() };
    const set = jest.fn().mockReturnValue(chain);
    mockedGetDb.mockReturnValue({ updateTable: () => ({ set }) });

    await new LessonRepository().save({ id: "l1", churchId: "c1", name: "Creation" } as Lesson);

    expect(wheres).toContainEqual(["id", "=", "l1"]);
    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
  });
});
