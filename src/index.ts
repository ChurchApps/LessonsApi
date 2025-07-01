import { init } from './App';
import { Environment } from './helpers/Environment';
import { Pool } from "@churchapps/apihelper";

const port = process.env.SERVER_PORT;

Environment.init(process.env.APP_ENV || 'dev').then(() => {
  Pool.initPool();
  init().then(app => {
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}/`);
    });
  });
});