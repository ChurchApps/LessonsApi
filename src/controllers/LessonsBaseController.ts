import { Repositories } from "../repositories";
import { CustomBaseController } from "@churchapps/apihelper";

export class LessonsBaseController extends CustomBaseController {
  public repositories: Repositories;

  constructor() {
    super();
    this.repositories = Repositories.getCurrent();
  }
}
