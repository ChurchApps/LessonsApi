import { controller, httpGet } from "inversify-express-utils";
import express from "express";
import { LessonsBaseController } from "./LessonsBaseController";

interface SearchDocument {
  id: string;
  type: "program" | "study" | "lesson";
  name: string;
  description: string;
  slug: string;
  image: string;
  age: string;
  programName: string;
  programSlug: string;
  studyName: string;
  studySlug: string;
  lessonSlug: string;
  categories: string;
  lessonCount: number;
}

@controller("/search")
export class SearchController extends LessonsBaseController {
  @httpGet("/export")
  public async export(req: express.Request<{}, {}, null>, res: express.Response): Promise<any> {
    return this.actionWrapperAnon(req, res, async () => {
      const documents: SearchDocument[] = [];

      // Load all programs
      const programs = await this.repositories.program.loadPublicAll();

      // Load all studies
      const studies = await this.repositories.study.loadPublicAll();

      // Create maps for lookups
      const programMap = new Map(programs.map((p: any) => [p.id, p]));
      const studyMap = new Map(studies.map((s: any) => [s.id, s]));

      // Load study categories for each program
      const studyCategoryMap = new Map<string, string[]>();
      for (const program of programs) {
        try {
          const categories = await this.repositories.studyCategory.loadPublicByProgram(program.id);
          for (const cat of categories) {
            if (!studyCategoryMap.has(cat.studyId)) {
              studyCategoryMap.set(cat.studyId, []);
            }
            studyCategoryMap.get(cat.studyId)!.push(cat.categoryName);
          }
        } catch (e) {
          // Some programs may not have categories
        }
      }

      // Add programs as searchable documents
      for (const program of programs) {
        documents.push({
          id: `program-${program.id}`,
          type: "program",
          name: program.name || "",
          description: program.description || program.shortDescription || "",
          slug: program.slug || "",
          image: program.image || "",
          age: program.age || "",
          programName: program.name || "",
          programSlug: program.slug || "",
          studyName: "",
          studySlug: "",
          lessonSlug: "",
          categories: "",
          lessonCount: 0,
        });
      }

      // Add studies as searchable documents
      for (const study of studies) {
        const program: any = programMap.get(study.programId);
        const categories = studyCategoryMap.get(study.id) || [];

        documents.push({
          id: `study-${study.id}`,
          type: "study",
          name: study.name || "",
          description: study.description || study.shortDescription || "",
          slug: study.slug || "",
          image: study.image || "",
          age: program?.age || "",
          programName: program?.name || "",
          programSlug: program?.slug || "",
          studyName: study.name || "",
          studySlug: study.slug || "",
          lessonSlug: "",
          categories: categories.join(", "),
          lessonCount: study.lessonCount || 0,
        });
      }

      // Load all lessons for each study
      for (const study of studies) {
        try {
          const lessons = await this.repositories.lesson.loadPublicByStudyId(study.id);
          const program: any = programMap.get(study.programId);
          const categories = studyCategoryMap.get(study.id) || [];

          for (const lesson of lessons) {
            documents.push({
              id: `lesson-${lesson.id}`,
              type: "lesson",
              name: lesson.title || lesson.name || "",
              description: lesson.description || "",
              slug: lesson.slug || "",
              image: lesson.image || study.image || "",
              age: program?.age || "",
              programName: program?.name || "",
              programSlug: program?.slug || "",
              studyName: study.name || "",
              studySlug: study.slug || "",
              lessonSlug: lesson.slug || "",
              categories: categories.join(", "),
              lessonCount: 0,
            });
          }
        } catch (e) {
          // Some studies may not have lessons
        }
      }

      return documents;
    });
  }
}
