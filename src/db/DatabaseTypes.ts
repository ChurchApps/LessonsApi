export interface ActionsTable {
  id: string;
  churchId: string | null;
  lessonId: string | null;
  roleId: string | null;
  actionType: string | null;
  content: string | null;
  sort: number | null;
  resourceId: string | null;
  assetId: string | null;
  externalVideoId: string | null;
  addOnId: string | null;
}

export interface AddOnsTable {
  id: string;
  churchId: string | null;
  providerId: string | null;
  category: string | null;
  name: string | null;
  image: string | null;
  addOnType: string | null;
  fileId: string | null;
}

export interface AddOnPlaylistsTable {
  id: string;
  churchId: string | null;
  providerId: string | null;
  name: string | null;
}

export interface AddOnPlaylistItemsTable {
  id: string;
  churchId: string | null;
  playlistId: string | null;
  addOnId: string | null;
  sort: number | null;
}

export interface AssetsTable {
  id: string;
  churchId: string | null;
  resourceId: string | null;
  fileId: string | null;
  name: string | null;
  sort: number | null;
}

export interface BundlesTable {
  id: string;
  churchId: string | null;
  contentType: string | null;
  contentId: string | null;
  name: string | null;
  fileId: string | null;
  pendingUpdate: boolean | null;
  dateModified: Date | null;
}

export interface ClassroomsTable {
  id: string;
  churchId: string | null;
  name: string | null;
  recentGroupId: string | null;
  upcomingGroupId: string | null;
}

export interface CustomizationsTable {
  id: string;
  churchId: string | null;
  venueId: string | null;
  classroomId: string | null;
  contentType: string | null;
  contentId: string | null;
  action: string | null;
  actionContent: string | null;
}

export interface DownloadsTable {
  id: string;
  lessonId: string | null;
  fileId: string | null;
  userId: string | null;
  churchId: string | null;
  ipAddress: string | null;
  downloadDate: Date | null;
  fileName: string | null;
}

export interface ExternalProvidersTable {
  id: string;
  churchId: string | null;
  name: string | null;
  apiUrl: string | null;
}

export interface ExternalVideosTable {
  id: string;
  churchId: string | null;
  contentType: string | null;
  contentId: string | null;
  name: string | null;
  videoProvider: string | null;
  videoId: string | null;
  seconds: number | null;
  loopVideo: boolean | null;
  play720: string | null;
  play1080: string | null;
  play4k: string | null;
  download720: string | null;
  download1080: string | null;
  download4k: string | null;
  thumbnail: string | null;
  downloadsExpire: Date | null;
  pendingUpdate: boolean | null;
}

export interface FilesTable {
  id: string;
  churchId: string | null;
  fileName: string | null;
  contentPath: string | null;
  fileType: string | null;
  size: number | null;
  seconds: number | null;
  dateModified: Date | null;
  thumbPath: string | null;
}

export interface IpDetailsTable {
  id: string;
  ipAddress: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  lat: number | null;
  lon: number | null;
  isp: string | null;
}

export interface LessonsTable {
  id: string;
  churchId: string | null;
  studyId: string | null;
  name: string | null;
  slug: string | null;
  title: string | null;
  sort: number | null;
  image: string | null;
  live: boolean | null;
  description: string | null;
  videoEmbedUrl: string | null;
}

export interface ProgramsTable {
  id: string;
  churchId: string | null;
  providerId: string | null;
  name: string | null;
  slug: string | null;
  image: string | null;
  shortDescription: string | null;
  description: string | null;
  videoEmbedUrl: string | null;
  live: boolean | null;
  aboutSection: string | null;
  age: string | null;
  sort: number | null;
}

export interface ProvidersTable {
  id: string;
  churchId: string | null;
  name: string | null;
  live: boolean | null;
}

export interface ResourcesTable {
  id: string;
  churchId: string | null;
  bundleId: string | null;
  name: string | null;
  category: string | null;
  loopVideo: boolean | null;
}

export interface RolesTable {
  id: string;
  churchId: string | null;
  lessonId: string | null;
  sectionId: string | null;
  name: string | null;
  sort: number | null;
}

export interface SchedulesTable {
  id: string;
  churchId: string | null;
  classroomId: string | null;
  scheduledDate: Date | null;
  externalProviderId: string | null;
  programId: string | null;
  studyId: string | null;
  lessonId: string | null;
  venueId: string | null;
  displayName: string | null;
}

export interface SectionsTable {
  id: string;
  churchId: string | null;
  lessonId: string | null;
  venueId: string | null;
  name: string | null;
  sort: number | null;
  materials: string | null;
}

export interface StudiesTable {
  id: string;
  churchId: string | null;
  programId: string | null;
  name: string | null;
  slug: string | null;
  image: string | null;
  shortDescription: string | null;
  description: string | null;
  videoEmbedUrl: string | null;
  sort: number | null;
  live: boolean | null;
}

export interface StudyCategoriesTable {
  id: string;
  programId: string | null;
  studyId: string | null;
  categoryName: string | null;
  sort: number | null;
}

export interface VariantsTable {
  id: string;
  churchId: string | null;
  resourceId: string | null;
  fileId: string | null;
  name: string | null;
  downloadDefault: boolean | null;
  playerDefault: boolean | null;
  hidden: boolean | null;
}

export interface VenuesTable {
  id: string;
  churchId: string | null;
  lessonId: string | null;
  name: string | null;
  sort: number | null;
}

export interface LabelledBundlesTable {
  id: string;
  churchId: string | null;
  contentType: string | null;
  contentId: string | null;
  name: string | null;
  fileId: string | null;
  pendingUpdate: boolean | null;
  programId: string | null;
  studyId: string | null;
}

export interface Database {
  actions: ActionsTable;
  addOns: AddOnsTable;
  addOnPlaylists: AddOnPlaylistsTable;
  addOnPlaylistItems: AddOnPlaylistItemsTable;
  assets: AssetsTable;
  bundles: BundlesTable;
  classrooms: ClassroomsTable;
  customizations: CustomizationsTable;
  downloads: DownloadsTable;
  externalProviders: ExternalProvidersTable;
  externalVideos: ExternalVideosTable;
  files: FilesTable;
  ipDetails: IpDetailsTable;
  lessons: LessonsTable;
  programs: ProgramsTable;
  providers: ProvidersTable;
  resources: ResourcesTable;
  roles: RolesTable;
  schedules: SchedulesTable;
  sections: SectionsTable;
  studies: StudiesTable;
  studyCategories: StudyCategoriesTable;
  variants: VariantsTable;
  venues: VenuesTable;
  labelledBundles: LabelledBundlesTable;
}
