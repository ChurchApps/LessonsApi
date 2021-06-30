import { DB } from "../apiBase/db";
import { File } from "../models";
import { UniqueIdHelper } from "../helpers";

export class FileRepository {

    public save(file: File) {
        return file.id ? this.update(file) : this.create(file);
    }

    private async create(file: File) {
        file.id = UniqueIdHelper.shortId();
        const sql = "INSERT INTO files (id, churchId, fileName, contentPath, displayName, size, dateCreated, dateModified) VALUES (?, ?, ?, ?, ?, ?, NOW(), NOW());";
        const params = [file.id, file.churchId, file.fileName, file.contentPath, file.displayName, file.size];
        await DB.query(sql, params);
        return file;
    }

    private async update(file: File) {
        const sql = "UPDATE files SET fileName=?, contentPath=?, displayName=?, size=?, dateModified=NOW() WHERE id=? AND churchId=?";
        const params = [file.fileName, file.contentPath, file.displayName, file.size, file.id, file.churchId];
        await DB.query(sql, params);
        return file;
    }

    public load(id: string): Promise<File> {
        return DB.queryOne("SELECT * FROM files WHERE id=?", [id]);
    }

    public loadAll(churchId: string): Promise<File> {
        return DB.queryOne("SELECT * FROM files WHERE churchId=?", [churchId]);
    }

    public delete(churchId: string, id: string): Promise<File> {
        return DB.query("DELETE FROM files WHERE id=? AND churchId=?", [id, churchId]);
    }


}
