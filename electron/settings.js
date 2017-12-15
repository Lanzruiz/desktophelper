const Store = require("electron-store");
const store = new Store({
  name: "helpme",
  // encryptionKey: "aes-256-cbc"
});

const _ = require("lodash");

const settingsKeys = {
  helpMeUrl: "helpMeUrl",
  helpMeSecret: "helpMeSecret",
  helpMeEndpoints: "helpMeEndpoints",
  platform: "platform",
  accessToken: "accessToken",
  lastLoggedUsername: "lastLoggedUsername",
  firstName: "firstName",
  userRole: "userRole",
  lastViewedTicket: "lastViewedTicket",
  lastViewedSysId: "lastViewedSysId",
  lastProfileFieldSearch: "lastProfileFieldSearch",
  profileLocation: "profileLocation",
  profileBusinessUnit: "profileBusinessUnit",
  profileClient: "profileClient",
  profileCallBackNumber: "profileCallBackNumber"
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
  let dataToPreserve = {};
  dataToPreserve[settingsKeys.lastLoggedUsername] = store.get(settingsKeys.lastLoggedUsername);
  dataToPreserve[settingsKeys.helpMeUrl] = store.get(settingsKeys.helpMeUrl) ;
  dataToPreserve[settingsKeys.helpMeSecret] = store.get(settingsKeys.helpMeSecret);
  dataToPreserve[settingsKeys.helpMeEndpoints] = store.get(settingsKeys.helpMeEndpoints);
  dataToPreserve[settingsKeys.platform] = store.get(settingsKeys.platform);
  dataToPreserve[settingsKeys.profileLocation] = store.get(settingsKeys.profileLocation);
  dataToPreserve[settingsKeys.profileClient] = store.get(settingsKeys.profileClient);
  dataToPreserve[settingsKeys.profileBusinessUnit] = store.get(settingsKeys.profileBusinessUnit);
  dataToPreserve[settingsKeys.profileCallBackNumber] = store.get(settingsKeys.profileCallBackNumber);

  clear();

  _.forOwn(dataToPreserve, (value, key) => {
    save(key, value);
  });

}

function remove(settingsKey) {
  return store.delete(settingsKey);
}

module.exports = {
  settingsKeys: settingsKeys,
  save: save,
  read: read,
  clear: clear,
  reset: reset,
  remove: remove,
};