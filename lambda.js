const { createServer, proxy } = require('aws-serverless-express');
const { init } = require('./dist/App');
const { Pool } = require('@churchapps/apihelper');
const { TranscodeHelper } = require('./dist/helpers/TranscodeHelper');
const { Environment } = require('./dist/helpers/Environment');
const { ZipHelper } = require('./dist/helpers/ZipHelper');
const { GeoHelper } = require('./dist/helpers/GeoHelper');




const universal = function universal(event, context) {
  Environment.init(process.env.APP_ENV).then(() => { 
    init().then(app => {
      const server = createServer(app);
      return proxy(server, event, context);
    });
    Pool.initPool();
  });

}


const videoPingback = async (event, context) => {
  console.log(JSON.stringify(event));
  await TranscodeHelper.handlePingback(event);
}

const zipBundles = async (event, context) => {
  await ZipHelper.zipPendingBundles();
  await GeoHelper.lookupMissing();
}

module.exports.universal = universal;
module.exports.videoPingback = videoPingback;
module.exports.zipBundles = zipBundles;