import {
  FileRepository, LessonRepository, ProviderRepository, SectionRepository, StudyRepository, ProgramRepository, VenueRepository, RoleRepository,
  ActionRepository, ResourceRepository, VariantRepository, AssetRepository, ClassroomRepository, ScheduleRepository
} from ".";

export class Repositories {
  public action: ActionRepository;
  public asset: AssetRepository;
  public classroom: ClassroomRepository;
  public file: FileRepository;
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
    this.classroom = new ClassroomRepository();
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
