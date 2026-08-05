jest.mock("../../db", () => ({ getDb: jest.fn() }));
jest.mock("../../helpers", () => ({
  __esModule: true,
  UniqueIdHelper: { shortId: () => "gen", isMissing: (id?: string) => !id }
}));

import { getDb } from "../../db";
import { RoleRepository } from "../RoleRepository";
import { ActionRepository } from "../ActionRepository";

const mockedGetDb = getDb as jest.Mock;

const selectChain = (wheres: any[]) => {
  const chain: any = {
    selectAll: () => chain,
    where: (...args: any[]) => { wheres.push(args); return chain; },
    orderBy: () => chain,
    execute: () => Promise.resolve([])
  };
  return chain;
};

describe("venue content reads scope by churchId", () => {
  afterEach(() => jest.restoreAllMocks());

  it("loadBySectionId filters on churchId and sectionId", async () => {
    const wheres: any[] = [];
    mockedGetDb.mockReturnValue({ selectFrom: () => selectChain(wheres) });

    await new RoleRepository().loadBySectionId("c1", "sec1");

    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
    expect(wheres).toContainEqual(["sectionId", "=", "sec1"]);
  });

  it("loadByRoleId filters on churchId and roleId", async () => {
    const wheres: any[] = [];
    mockedGetDb.mockReturnValue({ selectFrom: () => selectChain(wheres) });

    await new ActionRepository().loadByRoleId("c1", "r1");

    expect(wheres).toContainEqual(["churchId", "=", "c1"]);
    expect(wheres).toContainEqual(["roleId", "=", "r1"]);
  });
});
