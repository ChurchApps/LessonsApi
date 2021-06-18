import { AssociatedFileRepository, FileRepository, LessonRepository, ProviderRepository, SectionRepository, StudyRepository } from ".";

export class Repositories {
    public associatedFile: AssociatedFileRepository;
    public file: FileRepository;
    public lesson: LessonRepository;
    public provider: ProviderRepository;
    public section: SectionRepository;
    public study: StudyRepository;

    private static _current: Repositories = null;
    public static getCurrent = () => {
        if (Repositories._current === null) Repositories._current = new Repositories();
        return Repositories._current;
    }

    constructor() {
        this.associatedFile = new AssociatedFileRepository();
        this.file = new FileRepository();
        this.lesson = new LessonRepository();
        this.provider = new ProviderRepository();
        this.section = new SectionRepository();
        this.study = new StudyRepository();
    }
}
