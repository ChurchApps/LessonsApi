const { configure } = require('@codegenie/serverless-express');

let serverlessExpress;
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
  try {
    await checkPool();
    
    // Initialize the handler only once
    if (!serverlessExpress) {
      const app = await init();
      serverlessExpress = configure({
        app,
        binarySettings: {
          contentTypes: [
            'application/octet-stream',
            'font/*', 
            'image/*',
            'application/pdf'
          ]
        },
        stripBasePath: false,
        resolutionMode: 'PROMISE'
      });
    }
    
    return serverlessExpress(event, context);
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Internal server error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
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
