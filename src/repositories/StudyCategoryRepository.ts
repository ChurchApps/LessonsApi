import { getDb } from "../db";
import { StudyCategory } from "../models";
import { UniqueIdHelper } from "../helpers";

export class StudyCategoryRepository {
  public save(studyCategory: StudyCategory) {
    if (UniqueIdHelper.isMissing(studyCategory.id)) return this.create(studyCategory);
    else return this.update(studyCategory);
  }

  public async create(studyCategory: StudyCategory) {
    studyCategory.id = UniqueIdHelper.shortId();
    await getDb().insertInto("studyCategories").values({
      id: studyCategory.id,
      programId: studyCategory.programId,
      studyId: studyCategory.studyId,
      categoryName: studyCategory.categoryName,
      sort: studyCategory.sort
    }).execute();
    return studyCategory;
  }

  public async update(studyCategory: StudyCategory) {
    await getDb().updateTable("studyCategories").set({ studyId: studyCategory.studyId, categoryName: studyCategory.categoryName, sort: studyCategory.sort }).where("id", "=", studyCategory.id).execute();
    return studyCategory;
  }

  public async loadByCategoryName(programId: string, categoryName: string): Promise<StudyCategory[]> {
    return await getDb().selectFrom("studyCategories").selectAll().where("programId", "=", programId).where("categoryName", "=", categoryName).orderBy("sort").execute() as StudyCategory[];
  }

  public async loadPublicByProgram(programId: string): Promise<StudyCategory[]> {
    return await getDb().selectFrom("studyCategories").selectAll().where("programId", "=", programId).orderBy("sort").execute() as StudyCategory[];
  }

  public async loadCategoryNames(programId: string): Promise<StudyCategory[]> {
    return await getDb().selectFrom("studyCategories").select("categoryName").where("programId", "=", programId).groupBy("categoryName").orderBy("categoryName").execute() as StudyCategory[];
  }

  public async delete(churchId: string, id: string): Promise<any> {
    return await getDb().deleteFrom("studyCategories").where("id", "=", id).execute();
  }
}
