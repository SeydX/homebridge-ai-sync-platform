function AISyncFanAccessory(api, log, accessory, device, status, session, debug) {
  this.api = api;
  this.log = log;
  this.debug = debug;
  this.accessory = accessory;

  this.fan = device;
  this.deviceId = device.device;

  //AccessoryInformation
  const AccessoryInformation = this.accessory.getService(this.api.hap.Service.AccessoryInformation);

  this.accessory.context.manufacturer = status.data.profile.esh.brand.toString() || 'AiSync';
  this.accessory.context.model = status.data.profile.esh.model.toString() || 'AiSync';
  this.accessory.context.serial = status.data.profile.module.mac_address.toString() || '000000';
  this.accessory.context.revision = status.data.profile.module.firmware_version.toString() || '1.0';

  AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.Manufacturer, this.accessory.context.manufacturer);
  AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.Model, this.accessory.context.model);
  AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.SerialNumber, this.accessory.context.serial);
  AccessoryInformation.setCharacteristic(this.api.hap.Characteristic.FirmwareRevision, this.accessory.context.revision);

  //Service.Fan
  this.service = this.accessory.getService(this.api.hap.Service.Fan);

  this.service
    .getCharacteristic(this.api.hap.Characteristic.On)
    .on('get', this._getCurrentState.bind(this))
    .on('set', this._setOnOffState.bind(this));

  this.service
    .getCharacteristic(this.api.hap.Characteristic.RotationSpeed)
    .setProps({
      minValue: 0,
      maxValue: 100,
      minStep: 25,
    })
    .on('get', this._getSpeedState.bind(this))
    .on('set', this._setSpeedState.bind(this));

  this.lightService = this.accessory.getService(this.api.hap.Service.Lightbulb);

  this.lightService
    .getCharacteristic(this.api.hap.Characteristic.On)
    .on('get', this._getCurrentLightState.bind(this))
    .on('set', this._setLightOnOffState.bind(this));

  this.accessory.updateReachability(true);

  this.aisync = session;
}

AISyncFanAccessory.prototype = {
  eventUpdate: function (data) {
    if (this.debug) {
      this.log(`[DEBUG] ${this.accessory.displayName}: Event Update`);
      this.log(`[DEBUG] ${this.accessory.displayName}: ${JSON.stringify(data)}`);
    }

    if (data && data.data && data.data.changes && data.data.changes.status) {
      const status = data.data.changes.status;

      this.service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(status.H00 === 1);
      this.service.getCharacteristic(this.api.hap.Characteristic.RotationSpeed).updateValue(status.H02 || 0);
      this.lightService.getCharacteristic(this.api.hap.Characteristic.On).updateValue(status.H0B === 1);
    } else {
      if (this.debug) {
        this.log(`[DEBUG] ${this.accessory.displayName}: Undefined status. Dumping data:`);
        this.log(`[DEBUG] ${this.accessory.displayName}: ${JSON.stringify(data) || data}`);
      }
    }
  },

  _getCurrentState: function (callback) {
    const state = this.service.getCharacteristic(this.api.hap.Characteristic.On).value;

    this.aisync.deviceStatus(this.deviceId, (data) => {
      if (this.debug) {
        this.log(`[DEBUG] ${this.accessory.displayName}: Get Current State`);
        this.log(`[DEBUG] ${this.accessory.displayName}: ${JSON.stringify(data)}`);
      }

      if (data && data.data && data.data.status) {
        this.service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(data.data.status.H00 === 1);
      } else {
        if (this.debug) {
          this.log(`[DEBUG] ${this.accessory.displayName}: Undefined status. Dumping data:`);
          this.log(`[DEBUG] ${this.accessory.displayName}: ${JSON.stringify(data) || data}`);
        }
      }
    });

    callback(null, state);
  },

  _setOnOffState: function (targetState, callback) {
    const val = targetState === true ? 1 : 0;

    // eslint-disable-next-line no-unused-vars
    this.aisync.fanOnOff(this.deviceId, val, (data) =>
      this.log(`${this.accessory.displayName}: State: ${targetState ? 'ON' : 'OFF'}`)
    );

    callback(null);
  },

  _getSpeedState: function (callback) {
    const state = this.service.getCharacteristic(this.api.hap.Characteristic.RotationSpeed).value;

    this.aisync.deviceStatus(this.deviceId, (data) => {
      if (data && data.data && data.data.status) {
        /*if(this.debug){
          this.log(`[DEBUG] ${this.accessory.displayName}: Get Speed State`);
          this.log(`[DEBUG] ${this.accessory.displayName}: ${JSON.stringify(data, null, 2)}`);
        }*/
        this.service
          .getCharacteristic(this.api.hap.Characteristic.RotationSpeed)
          .updateValue(data.data.status.H02 || 0);
      } /*else {
        if (this.debug) {
          this.log(`[DEBUG] ${this.accessory.displayName}: Undefined status. Dumping data:`);
          this.log(`[DEBUG] ${this.accessory.displayName}: ${JSON.stringify(data) || data}`);
        }
      }*/
    });

    callback(null, state);
  },

  _setSpeedState: function (targetValue, callback) {
    // eslint-disable-next-line no-unused-vars
    this.aisync.fanSpeed(this.deviceId, targetValue, (data) =>
      this.log(`${this.accessory.displayName}: Rotation Speed: ${targetValue}`)
    );

    callback(null);
  },

  _getCurrentLightState: function (callback) {
    const state = this.lightService.getCharacteristic(this.api.hap.Characteristic.On).value;

    this.aisync.deviceStatus(this.deviceId, (data) => {
      if (data && data.data && data.data.status) {
        /*if(this.debug){
          this.log(`[DEBUG] ${this.accessory.displayName}: Get Current Light State`);
          this.log(`[DEBUG] ${this.accessory.displayName}: ${JSON.stringify(data, null, 2)}`);
        }*/
        this.lightService.getCharacteristic(this.api.hap.Characteristic.On).updateValue(data.data.status.H0B === 1);
      } /*else {
        if (this.debug) {
          this.log(`[DEBUG] ${this.accessory.displayName}: Undefined status. Dumping data:`);
          this.log(`[DEBUG] ${this.accessory.displayName}: ${JSON.stringify(data) || data}`);
        }
      }*/
    });

    callback(null, state);
  },

  _setLightOnOffState: function (targetState, callback) {
    var val = targetState === true ? 1 : 0;

    // eslint-disable-next-line no-unused-vars
    this.aisync.lightOnOff(this.deviceId, val, (data) =>
      this.log(`${this.accessory.displayName}: Light: ${targetState ? 'ON' : 'OFF'}`)
    );

    callback(null);
  },
};

module.exports = AISyncFanAccessory;
