const env = require("./env");

let config = {

  api: {
    host: env.api.host,
    secret: env.api.secret
  },

  browserWindows: {
    frame: false
  }

};

module.exports = config;