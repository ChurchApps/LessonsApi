import { DB } from "../apiBase/db";
import { AssociatedFile } from "../models";
import { UniqueIdHelper } from "../helpers";

export class AssociatedFileRepository {

    public save(associatedFile: AssociatedFile) {
        return associatedFile.id ? this.update(associatedFile) : this.create(associatedFile);
    }

    private async create(associatedFile: AssociatedFile) {
        associatedFile.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO associatedFiles (id, churchId, contentType, contentId, fileId, fileRole) VALUES (?, ?, ?, ?, ?, ?);";
        const params = [associatedFile.id, associatedFile.churchId, associatedFile.contentType, associatedFile.contentId, associatedFile.fileId, associatedFile.fileRole];
        await DB.query(sql, params);
        return associatedFile;
    }

    private async update(associatedFile: AssociatedFile) {
        const sql = "UPDATE associatedFiles SET contentType=?, contentId=?, fileId=?, fileRole=? WHERE id=? AND churchId=?";
        const params = [associatedFile.contentType, associatedFile.contentId, associatedFile.fileId, associatedFile.fileRole, associatedFile.id, associatedFile.churchId];
        await DB.query(sql, params);
        return associatedFile;
    }

    public loadByFileIdId(fileId: string): Promise<AssociatedFile[]> {
        return DB.query("SELECT * FROM associatedFiles WHERE fileId=?", [fileId]);
    }

    public loadByContentTypeId(contentType: string, contentId: string): Promise<AssociatedFile[]> {
        return DB.query("SELECT * FROM associatedFiles WHERE contentType=? AND contentId=?", [contentType, contentId]);
    }

    public load(id: string): Promise<AssociatedFile> {
        return DB.queryOne("SELECT * FROM associatedFiles WHERE id=?", [id]);
    }

    public delete(churchId: string, id: string): Promise<AssociatedFile> {
        return DB.query("DELETE FROM associatedFiles WHERE id=? AND churchId=?", [id, churchId]);
    }

    public deleteForFile(churchId: string, fileId: string) {
        const sql = "DELETE FROM associatedFiles WHERE churchId=? AND fileId=?"
        const params = [churchId, fileId];
        return DB.query(sql, params);
    }

}
