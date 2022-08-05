import {
  FileRepository, LessonRepository, ProviderRepository, SectionRepository, StudyRepository, ProgramRepository, VenueRepository, RoleRepository,
  ActionRepository, ResourceRepository, VariantRepository, AssetRepository, ClassroomRepository, ScheduleRepository, BundleRepository, CustomizationRepository, DownloadRepository,
  IpDetailRepository,
  ExternalVideoRepository
} from ".";


export class Repositories {
  public action: ActionRepository;
  public asset: AssetRepository;
  public bundle: BundleRepository;
  public classroom: ClassroomRepository;
  public customization: CustomizationRepository;
  public download: DownloadRepository;
  public externalVideo: ExternalVideoRepository
  public file: FileRepository;
  public ipDetails: IpDetailRepository;
  public lesson: LessonRepository;
  public provider: ProviderRepository;
  public program: ProgramRepository;
  public resource: ResourceRepository;
  public role: RoleRepository;
  public schedule: ScheduleRepository;
  public section: SectionRepository;
  public study: StudyRepository;
  public variant: VariantRepository;
  public venue: VenueRepository;

  private static _current: Repositories = null;
  public static getCurrent = () => {
    if (Repositories._current === null) Repositories._current = new Repositories();
    return Repositories._current;
  }

  constructor() {
    this.action = new ActionRepository();
    this.asset = new AssetRepository();
    this.bundle = new BundleRepository();
    this.classroom = new ClassroomRepository();
    this.customization = new CustomizationRepository();
    this.download = new DownloadRepository();
    this.ipDetails = new IpDetailRepository();
    this.externalVideo = new ExternalVideoRepository();
    this.file = new FileRepository();
    this.lesson = new LessonRepository();
    this.provider = new ProviderRepository();
    this.program = new ProgramRepository();
    this.resource = new ResourceRepository();
    this.role = new RoleRepository();
    this.schedule = new ScheduleRepository();
    this.section = new SectionRepository();
    this.study = new StudyRepository();
    this.variant = new VariantRepository();
    this.venue = new VenueRepository();
  }
}
