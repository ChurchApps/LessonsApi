import { File } from "./File";

export class AddOn {
  public id?: string;
  public churchId?: string;
  public providerId?: string;
  public category?: string;
  public name?: string;
  public image?: string;
  public addOnType?: string;
  public fileId?: string;

  public file?: File;
}
