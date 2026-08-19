import { YearPlanWeek } from "./YearPlanWeek";

export interface YearPlan {
  id?: string;
  churchId?: string;
  name?: string;
  slug?: string;
  programId?: string;
  venuePreference?: string;
  sort?: number;
  live?: boolean;
  weeks?: YearPlanWeek[];
}
