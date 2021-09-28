var AISyncAccessory = require('./AISyncAccessory.js');

function AISyncFanAccessory(api, log, accessory, device, status, session) {
  AISyncAccessory.call(this, api, log, accessory, device, status, session);

  this.api = api;
  this.log = log;
  this.fan = device;

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
    const status = data.data.changes.status;

    if (status === undefined) {
      this.log('Undefined status. Dumping data:');
      this.log(data);
    } else {
      this.service.getCharacteristic(this.api.hap.Characteristic.On).setValue(status.H00, null, 'internal');
      this.service.getCharacteristic(this.api.hap.Characteristic.RotationSpeed).setValue(status.H02, null, 'internal');

      this.lightService.getCharacteristic(this.api.hap.Characteristic.On).setValue(status.H0B, null, 'internal');
    }
  },

  _getCurrentState: function (callback) {
    const state = this.service.getCharacteristic(this.api.hap.Characteristic.On).value;
    callback(null, state);

    this.aisync.deviceStatus(this.deviceId, (data) => {
      if (data.data.status.H00 == 1) {
        this.service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(true);
      } else {
        this.service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(false);
      }
    });
  },

  _setOnOffState: function (targetState, callback, context) {
    callback(null);

    if (context == 'internal') {
      return; // we set this state ourself, no need to react to it
    }

    const val = targetState === true ? 1 : 0;

    // eslint-disable-next-line no-unused-vars
    this.aisync.fanOnOff(this.deviceId, val, (data) => {
      this.log(`State: ${targetState ? 'ON' : 'OFF'}`);
    });
  },

  _getSpeedState: function (callback) {
    const state = this.service.getCharacteristic(this.api.hap.Characteristic.RotationSpeed).value;
    callback(null, state);

    this.aisync.deviceStatus(this.deviceId, (data) => {
      this.service.getCharacteristic(this.api.hap.Characteristic.RotationSpeed).updateValue(data.data.status.H02);
    });
  },

  _setSpeedState: function (targetValue, callback, context) {
    callback(null);

    if (context == 'internal') {
      return; // we set this state ourself, no need to react to it
    }

    // eslint-disable-next-line no-unused-vars
    this.aisync.fanSpeed(this.deviceId, targetValue, (data) => {
      this.log(`Rotation  Speed: ${targetValue}`);
    });
  },

  _getCurrentLightState: function (callback) {
    const state = this.lightService.getCharacteristic(this.api.hap.Characteristic.On).value;
    callback(null, state);

    this.aisync.deviceStatus(this.deviceId, (data) => {
      if (data.data.status.H0B == 1) {
        this.lightService.getCharacteristic(this.api.hap.Characteristic.On).updateValue(true);
      } else {
        this.lightService.getCharacteristic(this.api.hap.Characteristic.On).updateValue(false);
      }
    });
  },

  _setLightOnOffState: function (targetState, callback, context) {
    callback(null);

    if (context == 'internal') {
      return; // we set this state ourself, no need to react to it
    }

    var val = targetState === true ? 1 : 0;

    // eslint-disable-next-line no-unused-vars
    this.aisync.lightOnOff(this.deviceId, val, (data) => {
      this.log(`Light: ${targetState ? 'ON' : 'OFF'}`);
    });
  },
};

module.exports = AISyncFanAccessory;
