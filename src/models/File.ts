export class File {
  public id?: string;
  public churchId?: string;
  public fileName?: string;
  public contentPath?: string;
  public fileType?: string;
  public size?: number;
  public dateModified?: Date;
  public seconds?: number;
  public thumbPath?: string;

  public resourceId?: string;     // doesn't get saved, but determines the file path.
  public fileContents?: string;

}
