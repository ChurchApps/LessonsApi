jest.mock("../../db", () => ({ getDb: jest.fn() }));
jest.mock("../../helpers", () => ({
  __esModule: true,
  UniqueIdHelper: { shortId: () => "study_gen", isMissing: (id?: string) => !id }
}));

import { getDb } from "../../db";
import { StudyRepository } from "../StudyRepository";
import { Study } from "../../models";

const mockedGetDb = getDb as jest.Mock;

describe("StudyRepository.save", () => {
  afterEach(() => jest.restoreAllMocks());

  it("creates with a generated id and includes churchId", async () => {
    const values = jest.fn().mockReturnValue({ execute: () => Promise.resolve() });
    mockedGetDb.mockReturnValue({ insertInto: () => ({ values }) });

    const study = await new StudyRepository().save({ churchId: "c1", name: "Genesis" } as Study);

    expect(study.id).toBe("study_gen");
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ id: "study_gen", churchId: "c1", name: "Genesis" }));
  });

  it("updates scoped to id and churchId", async () => {
    const wheres: any[] = [];
    const chain: any = { where: (...args: any[]) => { wheres.push(args); return chain; }, execute: () => Promise.resolve() };
    const set = jest.fn().mockReturnValue(chain);
    mockedGetDb.mockReturnValue({ updateTable: () => ({ set }) });

    await new StudyRepository().save({ id: "s1", churchId: "c1", name: "Genesis" } as Study);

    expect(set).toHaveBeenCalledWith(expect.objectContaining({ name: "Genesis" }));
    expect(wheres).toContainEqual(["id", "=", "s1"]);
    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
  });
});

describe("StudyRepository.delete", () => {
  it("deletes scoped to id and churchId", async () => {
    const wheres: any[] = [];
    const chain: any = { where: (...args: any[]) => { wheres.push(args); return chain; }, execute: () => Promise.resolve([]) };
    mockedGetDb.mockReturnValue({ deleteFrom: () => chain });

    await new StudyRepository().delete("c1", "s1");

    expect(wheres).toContainEqual(["id", "=", "s1"]);
    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
  });
});

describe("StudyRepository id-list loads", () => {
  it("returns [] without querying when the id list is empty", async () => {
    mockedGetDb.mockImplementation(() => { throw new Error("should not query"); });
    const repo = new StudyRepository();
    expect(await repo.loadPublicByIds([])).toEqual([]);
    expect(await repo.loadPublicByProgramIds([])).toEqual([]);
  });
});
