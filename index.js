var AISyncApi = require('ai-sync-api').AISyncApi;
var Accessory, Service, UUIDGen;

var AISyncFanAccessory = require('./accessories/AISyncFanAccessory');

module.exports = function (homebridge) {
  // Accessory must be created from PlatformAccessory Constructor
  Accessory = homebridge.platformAccessory;

  // Service and Characteristic are from hap-nodejs
  Service = homebridge.hap.Service;
  UUIDGen = homebridge.hap.uuid;

  // For platform plugin to be considered as dynamic platform plugin,
  // registerPlatform(pluginName, platformName, constructor, dynamic), dynamic must be true
  homebridge.registerPlatform('homebridge-ai-sync-platform', 'AISync', AISync, true);
};

function AISync(log, config, api) {
  if (!api || !config) return;

  this.api = api;
  this.log = log;
  this.accessories = [];

  this.subscribed = false;
  this.aisync = null;
  this.config = config;

  this.api.on('didFinishLaunching', this.didFinishLaunching.bind(this));
}

AISync.prototype = {
  didFinishLaunching: function () {
    this.aisync = new AISyncApi({
      email: this.config.email,
      password: this.config.password,
    });

    this.aisync.getDevices((data) => {
      const devices = data.data;

      for (const i in devices) {
        var device = devices[i];
        this.addAccessories(device);
      }
    });

    this.aisync.eventEmitter.on('device_change', this.eventHandler.bind(this));
  },

  eventHandler: function (data) {
    const uuid = UUIDGen.generate(data.data.device);
    const accessory = this.accessories[uuid];

    if (accessory) {
      accessory.eventUpdate(data);
    }
  },

  configureAccessory: function (accessory) {
    this.accessories[accessory.UUID] = accessory;

    if (!accessory.getService(Service.Lightbulb)) {
      //Adding light service to upgrade existing installs.
      accessory.addService(Service.Lightbulb);
    }
    if (this.config === null) {
      this.removeAccessory(accessory);
    }
  },

  addAccessories: function (device) {
    this.aisync.deviceStatus(device.device, (deviceStatus) => {
      const uuid = UUIDGen.generate(deviceStatus.data.device);

      //Add fan
      const accessory = this.accessories[uuid];

      if (accessory === undefined) {
        this.registerFanAccessory(device, deviceStatus);
      } else {
        this.accessories[uuid] = new AISyncFanAccessory(
          this.api,
          this.log,
          accessory instanceof AISyncFanAccessory ? accessory.accessory : accessory,
          device,
          deviceStatus,
          this.aisync
        );
      }
    });
  },

  registerFanAccessory: function (device, status) {
    const uuid = UUIDGen.generate(status.data.device);
    const name = device.properties.displayName == '' ? 'Fan' : device.properties.displayName;
    const acc = new Accessory(name, uuid);

    acc.addService(Service.Fan);
    acc.addService(Service.Lightbulb);

    this.accessories[uuid] = new AISyncFanAccessory(this.log, acc, device, status, this.aisync);

    this.api.registerPlatformAccessories('homebridge-ai-sync-platform', 'AISync', [acc]);
  },

  removeAccessory: function (accessory) {
    if (accessory) {
      this.log('[' + accessory.name + '] Removed from HomeBridge.');
      if (this.accessories[accessory.UUID]) {
        delete this.accessories[accessory.UUID];
      }

      this.api.unregisterPlatformAccessories('homebridge-ai-sync-platform', 'AISync', [accessory]);
    }
  },
};
