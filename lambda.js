const serverlessExpress = require("@vendia/serverless-express");
const {
  init
} = require("./dist/App");
const {
  Pool
} = require("@churchapps/apihelper");
const {
  TranscodeHelper
} = require("./dist/helpers/TranscodeHelper");
const {
  Environment
} = require("./dist/helpers/Environment");
//const { ZipHelper } = require('./dist/helpers/ZipHelper');
const {
  GeoHelper
} = require("./dist/helpers/GeoHelper");

const checkPool =
  async () => {
    if (
      !Environment.connectionString
    ) {
      await Environment.init(
        process
          .env
          .APP_ENV
      );
      Pool.initPool();
    }
  };

const universal = async (event, context) => {
  await checkPool();
  const app = await init();
  const handler = serverlessExpress({ app });
  return handler(event, context);
};

const videoPingback =
  async (
    event,
    context
  ) => {
    await checkPool();
    await TranscodeHelper.handlePingback(
      event
    );
  };

const zipBundles =
  async (
    event,
    context
  ) => {
    await checkPool();
    await ZipHelper.zipPendingBundles();
    await GeoHelper.lookupMissing();
  };

module.exports.universal =
  universal;
module.exports.videoPingback =
  videoPingback;
module.exports.zipBundles =
  zipBundles;
