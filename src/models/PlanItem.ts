// The planItems shape returned by /venues/public/planItems/:id and /externalProviders/.../planItems.
export interface PlanItem {
  id?: string;
  churchId?: string;
  planId?: string;
  parentId?: string;
  sort?: number;
  itemType?: string;
  relatedId?: string;
  label?: string;
  description?: string;
  seconds?: number;
  link?: string;
  children?: PlanItem[];
}
