import { Repositories } from "../repositories";

export async function ownsContent(repositories: Repositories, churchId: string, contentType: string, contentId: string) {
  if (!contentId) return false;
  switch (contentType) {
    case "addOn": return (await repositories.addOn.load(contentId))?.churchId === churchId;
    case "lesson": return !!(await repositories.lesson.load(churchId, contentId));
    case "study": return !!(await repositories.study.load(churchId, contentId));
    case "program": return !!(await repositories.program.load(churchId, contentId));
    default: return false;
  }
}
