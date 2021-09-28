function AISyncAccessory(api, log, accessory, device, status, session) {
  this.accessory = accessory;
  this.log = log;
  this.api = api;
  this.session = session;
  this.deviceId = device.device;

  const service = accessory.getService(api.hap.Service.AccessoryInformation);

  accessory.context.manufacturer = status.data.profile.esh.brand;
  service.setCharacteristic(api.hap.Characteristic.Manufacturer, accessory.context.manufacturer.toString());

  accessory.context.model = status.data.profile.esh.model;
  service.setCharacteristic(api.hap.Characteristic.Model, accessory.context.model.toString());

  accessory.context.serial = status.data.profile.module.mac_address;
  service.setCharacteristic(api.hap.Characteristic.SerialNumber, accessory.context.serial.toString());

  accessory.context.revision = status.data.profile.module.firmware_version;
  service.setCharacteristic(api.hap.Characteristic.FirmwareRevision, accessory.context.revision.toString());
}

AISyncAccessory.prototype = {
  // eslint-disable-next-line no-unused-vars
  event: function (event) {
    //This method needs to be overridden in each accessory type
  },
};

module.exports = AISyncAccessory;
