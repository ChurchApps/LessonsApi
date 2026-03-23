import type {
  Action, AddOn, AddOnPlaylist, AddOnPlaylistItem, Asset, Bundle,
  Classroom, Customization, Download, ExternalProvider, ExternalVideo,
  File, IpDetail, Lesson, Program, Provider, Resource, Role,
  Schedule, Section, Study, StudyCategory, Variant, Venue
} from "../models";

// Database view — no corresponding model
export interface LabelledBundlesTable {
  id?: string;
  churchId?: string;
  contentType?: string;
  contentId?: string;
  name?: string;
  fileId?: string;
  pendingUpdate?: boolean;
  programId?: string;
  studyId?: string;
}

export interface Database {
  // Models used directly (no navigation properties)
  actions: Action;
  addOnPlaylists: AddOnPlaylist;
  addOnPlaylistItems: AddOnPlaylistItem;
  classrooms: Classroom;
  customizations: Customization;
  downloads: Download;
  externalProviders: ExternalProvider;
  externalVideos: ExternalVideo;
  ipDetails: IpDetail;
  lessons: Lesson;
  programs: Program;
  providers: Provider;
  schedules: Schedule;
  studyCategories: StudyCategory;

  // Models with navigation properties stripped
  addOns: Omit<AddOn, "file">;
  assets: Omit<Asset, "file">;
  bundles: Omit<Bundle, "file">;
  files: Omit<File, "contentType" | "contentId" | "resourceId" | "fileContents">;
  resources: Omit<Resource, "variants" | "assets">;
  roles: Omit<Role, "actions">;
  sections: Omit<Section, "roles">;
  studies: Omit<Study, "lessonCount">;
  variants: Omit<Variant, "file">;
  venues: Omit<Venue, "sections">;

  // Database view
  labelledBundles: LabelledBundlesTable;
}
