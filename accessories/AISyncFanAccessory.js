function AISyncFanAccessory(api, log, accessory, device, status, session) {
  this.api = api;
  this.log = log;
  this.accessory = accessory;

  this.fan = device;
  this.deviceId = device.device;

  //AccessoryInformation
  const AccessoryInformation = this.accessory.getService(api.hap.Service.AccessoryInformation);

  this.accessory.context.manufacturer = status.data.profile.esh.brand.toString() || 'AiSync';
  this.accessory.context.model = status.data.profile.esh.model.toString() || 'AiSync';
  this.accessory.context.serial = status.data.profile.module.mac_address.toString() || '000000';
  this.accessory.context.revision = status.data.profile.module.firmware_version.toString() || '1.0';

  AccessoryInformation.setCharacteristic(api.hap.Characteristic.Manufacturer, this.accessory.context.manufacturer);
  AccessoryInformation.setCharacteristic(api.hap.Characteristic.Model, this.accessory.context.model);
  AccessoryInformation.setCharacteristic(api.hap.Characteristic.SerialNumber, this.accessory.context.serial);
  AccessoryInformation.setCharacteristic(api.hap.Characteristic.FirmwareRevision, this.accessory.context.revision);

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
    const status = data.data.changes.status;

    if (status === undefined) {
      this.log('Undefined status. Dumping data:');
      this.log(data);
    } else {
      this.service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(status.H00);
      this.service.getCharacteristic(this.api.hap.Characteristic.RotationSpeed).updateValue(status.H02);
      this.lightService.getCharacteristic(this.api.hap.Characteristic.On).updateValue(status.H0B);
    }
  },

  _getCurrentState: function (callback) {
    const state = this.service.getCharacteristic(this.api.hap.Characteristic.On).value;

    this.aisync.deviceStatus(this.deviceId, (data) => {
      if (data.data.status.H00 == 1) {
        this.service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(true);
      } else {
        this.service.getCharacteristic(this.api.hap.Characteristic.On).updateValue(false);
      }
    });

    callback(null, state);
  },

  _setOnOffState: function (targetState, callback) {
    const val = targetState === true ? 1 : 0;

    // eslint-disable-next-line no-unused-vars
    this.aisync.fanOnOff(this.deviceId, val, (data) => this.log(`State: ${targetState ? 'ON' : 'OFF'}`));

    callback(null);
  },

  _getSpeedState: function (callback) {
    const state = this.service.getCharacteristic(this.api.hap.Characteristic.RotationSpeed).value;

    this.aisync.deviceStatus(this.deviceId, (data) =>
      this.service.getCharacteristic(this.api.hap.Characteristic.RotationSpeed).updateValue(data.data.status.H02)
    );

    callback(null, state);
  },

  _setSpeedState: function (targetValue, callback) {
    // eslint-disable-next-line no-unused-vars
    this.aisync.fanSpeed(this.deviceId, targetValue, (data) => this.log(`Rotation  Speed: ${targetValue}`));

    callback(null);
  },

  _getCurrentLightState: function (callback) {
    const state = this.lightService.getCharacteristic(this.api.hap.Characteristic.On).value;

    this.aisync.deviceStatus(this.deviceId, (data) => {
      if (data.data.status.H0B == 1) {
        this.lightService.getCharacteristic(this.api.hap.Characteristic.On).updateValue(true);
      } else {
        this.lightService.getCharacteristic(this.api.hap.Characteristic.On).updateValue(false);
      }
    });

    callback(null, state);
  },

  _setLightOnOffState: function (targetState, callback) {
    var val = targetState === true ? 1 : 0;

    // eslint-disable-next-line no-unused-vars
    this.aisync.lightOnOff(this.deviceId, val, (data) => this.log(`Light: ${targetState ? 'ON' : 'OFF'}`));

    callback(null);
  },
};

module.exports = AISyncFanAccessory;
