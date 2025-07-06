import { DB } from "@churchapps/apihelper"
import { StudyCategory } from "../models";
import { UniqueIdHelper } from "../helpers";

export class StudyCategoryRepository {

  public save(studyCategory: StudyCategory) {
    if (UniqueIdHelper.isMissing(studyCategory.id)) return this.create(studyCategory); else return this.update(studyCategory);
  }

  public async create(studyCategory: StudyCategory) {
    studyCategory.id = UniqueIdHelper.shortId();
    const sql = "INSERT INTO studyCategories (id, programId, studyId, categoryName, sort) VALUES (?, ?, ?, ?, ?);";
    const params = [studyCategory.id, studyCategory.programId, studyCategory.studyId, studyCategory.categoryName, studyCategory.sort];
    await DB.query(sql, params);
    return studyCategory;
  }

  public async update(studyCategory: StudyCategory) {
    const sql = "UPDATE studyCategories SET studyId=?, categoryName=?, sort=? WHERE id=?";
    const params = [studyCategory.studyId, studyCategory.categoryName, studyCategory.sort, studyCategory.id];
    await DB.query(sql, params);
    return studyCategory;
  }

  public loadByCategoryName(programId:string, categoryName: string): Promise<StudyCategory[]> {
    return DB.query("SELECT * FROM studyCategories WHERE programId=? AND categoryName=? ORDER BY sort", [programId, categoryName]) as Promise<StudyCategory[]>
  }

  public loadPublicByProgram(programId:string): Promise<StudyCategory[]> {
    return DB.query("SELECT * FROM studyCategories WHERE programId=? ORDER BY sort", [programId]) as Promise<StudyCategory[]>
  }

  public loadCategoryNames(programId:string): Promise<StudyCategory[]> {
    return DB.query("SELECT categoryName FROM studyCategories WHERE programId=? GROUP BY categoryName ORDER BY categoryName", [programId]) as Promise<StudyCategory[]>
  }

  public delete(churchId: string, id: string): Promise<any> {
    return DB.query("DELETE FROM studyCategories WHERE id=?", [id]) as Promise<any>;
  }

}
