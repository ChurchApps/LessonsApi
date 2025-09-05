const { configure } = require("@codegenie/serverless-express");

let serverlessExpress;
const { init } = require("./dist/App");
const { Pool } = require("@churchapps/apihelper");
const { TranscodeHelper } = require("./dist/helpers/TranscodeHelper");
const { Environment } = require("./dist/helpers/Environment");
const { ZipHelper } = require("./dist/helpers/ZipHelper");
const { GeoHelper } = require("./dist/helpers/GeoHelper");

const checkPool = async () => {
  if (!Environment.connectionString) {
    await Environment.init(process.env.APP_ENV);
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
          contentTypes: ["application/octet-stream", "font/*", "image/*", "application/pdf"],
        },
        stripBasePath: false,
        resolutionMode: "PROMISE",
      });
    }

    return serverlessExpress(event, context);
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type,Authorization",
        "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: error.message,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};

const videoPingback = async (event, context) => {
  await checkPool();
  await TranscodeHelper.handlePingback(event);
};

const zipBundles = async (event, context) => {
  const startTime = Date.now();
  console.log("Lambda zipBundles invoked", {
    requestId: context.awsRequestId,
    timestamp: new Date().toISOString(),
  });

  try {
    await checkPool();

    // Get initial queue depth for metrics
    const { Repositories } = require("./dist/repositories/Repositories");
    const initialPending = await Repositories.getCurrent().bundle.loadPendingUpdate(50);
    console.log(`Initial queue depth: ${initialPending.length}`);

    await ZipHelper.zipPendingBundles();
    await GeoHelper.lookupMissing();

    // Get final queue depth for metrics
    const finalPending = await Repositories.getCurrent().bundle.loadPendingUpdate(50);
    const processingTime = Date.now() - startTime;

    const metrics = {
      initialQueueDepth: initialPending.length,
      finalQueueDepth: finalPending.length,
      processed: initialPending.length - finalPending.length,
      processingTimeMs: processingTime,
      requestId: context.awsRequestId,
      timestamp: new Date().toISOString(),
    };

    console.log("Lambda zipBundles completed successfully", metrics);

    // Return metrics for CloudWatch
    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        ...metrics,
      }),
    };
  } catch (error) {
    const processingTime = Date.now() - startTime;
    const errorDetails = {
      error: error.message,
      stack: error.stack,
      processingTimeMs: processingTime,
      requestId: context.awsRequestId,
      timestamp: new Date().toISOString(),
    };

    console.error("Lambda zipBundles failed", errorDetails);

    // Return error for CloudWatch monitoring
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        ...errorDetails,
      }),
    };
  }
};

module.exports.universal = universal;
module.exports.videoPingback = videoPingback;
module.exports.zipBundles = zipBundles;
