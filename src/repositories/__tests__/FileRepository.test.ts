jest.mock("../../db", () => ({ getDb: jest.fn() }));
jest.mock("../../helpers", () => ({
  __esModule: true,
  UniqueIdHelper: { shortId: () => "file_gen", isMissing: (id?: string) => !id }
}));

import { getDb } from "../../db";
import { FileRepository } from "../FileRepository";

const mockedGetDb = getDb as jest.Mock;

describe("FileRepository.cleanUp", () => {
  it("deletes unreferenced files only for the given churchId", async () => {
    const wheres: any[] = [];
    const sub: any = { select: () => sub, where: () => sub, unionAll: () => sub };
    const chain: any = { where: (...args: any[]) => { wheres.push(args); return chain; }, execute: () => Promise.resolve([]) };
    mockedGetDb.mockReturnValue({ deleteFrom: () => chain, selectFrom: () => sub });

    await new FileRepository().cleanUp("c1");

    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
    expect(wheres.some((w: any[]) => w[0] === "id" && w[1] === "not in")).toBe(true);
  });
});
