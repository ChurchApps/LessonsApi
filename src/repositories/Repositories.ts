import {
  AssociatedResourceRepository, FileRepository, LessonRepository, ProviderRepository, SectionRepository, StudyRepository, ProgramRepository, VenueRepository, RoleRepository,
  ActionRepository, ResourceRepository, VariantRepository, AssetRepository
} from ".";

export class Repositories {
  public action: ActionRepository;
  public asset: AssetRepository;
  public associatedResource: AssociatedResourceRepository;
  public file: FileRepository;
  public lesson: LessonRepository;
  public provider: ProviderRepository;
  public program: ProgramRepository;
  public resource: ResourceRepository;
  public role: RoleRepository;
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
    this.associatedResource = new AssociatedResourceRepository();
    this.file = new FileRepository();
    this.lesson = new LessonRepository();
    this.provider = new ProviderRepository();
    this.program = new ProgramRepository();
    this.resource = new ResourceRepository();
    this.role = new RoleRepository();
    this.section = new SectionRepository();
    this.study = new StudyRepository();
    this.variant = new VariantRepository();
    this.venue = new VenueRepository();
  }
}
