import { Variant } from "./Variant";
import { Asset } from "./Asset";

export interface Resource {
  id?: string;
  churchId?: string;
  bundleId?: string;
  name?: string;
  category?: string;
  loopVideo?: boolean;

  variants?: Variant[];
  assets?: Asset[];
}
