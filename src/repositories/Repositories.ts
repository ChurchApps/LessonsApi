import { AssociatedFileRepository, FileRepository, LessonRepository, ProviderRepository, SectionRepository, StudyRepository, ProgramRepository, VenueRepository, RoleRepository, ActionRepository } from ".";

export class Repositories {
  public action: ActionRepository;
  public associatedFile: AssociatedFileRepository;
  public file: FileRepository;
  public lesson: LessonRepository;
  public provider: ProviderRepository;
  public program: ProgramRepository;
  public role: RoleRepository;
  public section: SectionRepository;
  public study: StudyRepository;
  public venue: VenueRepository;

  private static _current: Repositories = null;
  public static getCurrent = () => {
    if (Repositories._current === null) Repositories._current = new Repositories();
    return Repositories._current;
  }

  constructor() {
    this.action = new ActionRepository();
    this.associatedFile = new AssociatedFileRepository();
    this.file = new FileRepository();
    this.lesson = new LessonRepository();
    this.provider = new ProviderRepository();
    this.program = new ProgramRepository();
    this.role = new RoleRepository();
    this.section = new SectionRepository();
    this.study = new StudyRepository();
    this.venue = new VenueRepository();
  }
}
