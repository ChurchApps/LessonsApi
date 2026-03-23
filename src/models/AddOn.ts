import { File } from "./File";

export interface AddOn {
  id?: string;
  churchId?: string;
  providerId?: string;
  category?: string;
  name?: string;
  image?: string;
  addOnType?: string;
  fileId?: string;

  file?: File;
}
