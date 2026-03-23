import { File } from "./File";

export interface Asset {
  id?: string;
  churchId?: string;
  resourceId?: string;
  fileId?: string;
  name?: string;
  sort?: number;

  file?: File;
}
