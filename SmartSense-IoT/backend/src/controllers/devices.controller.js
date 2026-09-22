import devicesService from '../services/devices.service.js';
import { sendSuccess } from '../utils/response.js';

export const getAllDevices = async (req, res, next) => {
  try {
    const devices = await devicesService.getAllDevices();
    return sendSuccess(res, devices, 200, { count: devices.length });
  } catch (err) {
    next(err);
  }
};

export const getDeviceById = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const device = await devicesService.getDeviceById(deviceId);
    return sendSuccess(res, device);
  } catch (err) {
    next(err);
  }
};

export const updateDeviceSecurity = async (req, res, next) => {
  try {
    const { deviceId } = req.params;
    const { securityMode } = req.body || {};
    const updated = await devicesService.updateSecurityMode(deviceId, securityMode);
    return sendSuccess(res, updated, 200, { message: `Device security mode updated to ${securityMode}` });
  } catch (err) {
    next(err);
  }
};

export default {
  getAllDevices,
  getDeviceById,
  updateDeviceSecurity,
};
