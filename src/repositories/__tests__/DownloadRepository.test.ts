jest.mock("../../db", () => ({ getDb: jest.fn() }));
jest.mock("../../helpers", () => ({
  __esModule: true,
  UniqueIdHelper: { shortId: () => "dl_gen", isMissing: (id?: string) => !id }
}));

import { getDb } from "../../db";
import { DownloadRepository } from "../DownloadRepository";
import { Download } from "../../models";

const mockedGetDb = getDb as jest.Mock;

describe("DownloadRepository.save", () => {
  it("creates with a generated id and churchId", async () => {
    const values = jest.fn().mockReturnValue({ execute: () => Promise.resolve() });
    mockedGetDb.mockReturnValue({ insertInto: () => ({ values }) });

    const download = await new DownloadRepository().save({ churchId: "c1", lessonId: "l1", userId: "u1" } as Download);

    expect(download.id).toBe("dl_gen");
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ id: "dl_gen", churchId: "c1", lessonId: "l1", userId: "u1" }));
  });

  it("updates scoped to id and churchId", async () => {
    const wheres: any[] = [];
    const chain: any = { where: (...args: any[]) => { wheres.push(args); return chain; }, execute: () => Promise.resolve() };
    const set = jest.fn().mockReturnValue(chain);
    mockedGetDb.mockReturnValue({ updateTable: () => ({ set }) });

    await new DownloadRepository().save({ id: "d1", churchId: "c1", lessonId: "l1", userId: "u1" } as Download);

    expect(set).toHaveBeenCalledWith(expect.not.objectContaining({ churchId: expect.anything() }));
    expect(wheres).toContainEqual(["id", "=", "d1"]);
    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
  });
});

describe("DownloadRepository.delete", () => {
  it("deletes scoped to id and churchId", async () => {
    const wheres: any[] = [];
    const chain: any = { where: (...args: any[]) => { wheres.push(args); return chain; }, execute: () => Promise.resolve([]) };
    mockedGetDb.mockReturnValue({ deleteFrom: () => chain });

    await new DownloadRepository().delete("c1", "d1");

    expect(wheres).toContainEqual(["id", "=", "d1"]);
    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
  });
});
