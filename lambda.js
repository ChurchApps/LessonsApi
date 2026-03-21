import { configure } from "@codegenie/serverless-express";
import { init } from "./dist/App.js";
import { TranscodeHelper } from "./dist/helpers/TranscodeHelper.js";
import { Environment } from "./dist/helpers/Environment.js";
import { ZipHelper } from "./dist/helpers/ZipHelper.js";
import { GeoHelper } from "./dist/helpers/GeoHelper.js";

let serverlessExpress;

const checkInit = async () => {
  if (!Environment.connectionString) {
    await Environment.init(process.env.APP_ENV);
  }
};

export const universal = async (event, context) => {
  try {
    await checkInit();

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

export const videoPingback = async (event, _context) => {
  await checkInit();
  await TranscodeHelper.handlePingback(event);
};

export const zipBundles = async (event, context) => {
  const startTime = Date.now();
  console.log("Lambda zipBundles invoked", {
    requestId: context.awsRequestId,
    timestamp: new Date().toISOString(),
  });

  try {
    await checkInit();

    // Get initial queue depth for metrics
    const { Repositories } = await import("./dist/repositories/Repositories.js");
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
