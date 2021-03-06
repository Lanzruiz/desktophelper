const env = require("./env");

let config = {

  api: {
    host: env.api.host,
    secret: env.api.secret,
    endpoints: {
      tokens: "/tokens",
      tickets: "/tickets",
      users: "/users",
      locations: "/locations",
      clients: "/clients"
    }
  },

  browserWindows: {
    frame: false
  }

};

module.exports = config;