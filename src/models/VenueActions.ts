// The shape returned by /venues/public/actions/:id and /externalProviders/.../actions.
export interface VenueActionSummary {
  id?: string;
  name?: string;
  actionType?: string;
  roleName?: string;
  seconds?: number;
}

export interface VenueActionsSection {
  id?: string;
  name?: string;
  actions: VenueActionSummary[];
}
