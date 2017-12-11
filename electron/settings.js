const Store = require("electron-store");
const store = new Store({
  name: "helpme",
  encryptionKey: "aes-256-cbc"
});

const settingsKeys = {
  helpMeUrl: "helpMeUrl",
  helpMeSecret: "helpMeSecret",
  helpMeEndpoints: "helpMeEndpoints",
  platform: "platform",
  accessToken: "accessToken",
  firstName: "firstName",
  lastViewedTicket: "lastViewedTicket",
  lastViewedSysId: "lastViewedSysId"
};

function save(settingsKey, settingsValue) {
  store.set(settingsKey, settingsValue);
}

function read(settingsKey) {
  return store.get(settingsKey);
}

function clear() {
  store.clear();
}

function reset() {
  let helpMeUrl = store.get(settingsKeys.helpMeUrl);
  let helpMeSecret = store.get(settingsKeys.helpMeSecret);
  let helpMeEndpoints = store.get(settingsKeys.helpMeEndpoints);
  let platform = store.get(settingsKeys.platform);
  clear();
  save(settingsKeys.helpMeUrl, helpMeUrl);
  save(settingsKeys.helpMeSecret, helpMeSecret);
  save(settingsKeys.helpMeEndpoints, helpMeEndpoints);
  save(settingsKeys.platform, platform);
}

module.exports = {
  settingsKeys: settingsKeys,
  save: save,
  read: read,
  clear: clear,
  reset: reset
};