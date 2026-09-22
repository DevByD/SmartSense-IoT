import firebaseService from './firebase.service.js';
import { AppError } from '../middleware/errorHandler.js';

const ALLOWED_SECURITY_MODES = ['ARMED', 'DISARMED'];

class DevicesService {
  async getAllDevices() {
    return await firebaseService.getAllDevices();
  }

  async getDeviceById(deviceId) {
    if (!deviceId || typeof deviceId !== 'string') {
      throw new AppError('INVALID_DEVICE_ID', 'Device ID parameter is required', 400);
    }

    const device = await firebaseService.getDeviceById(deviceId);
    if (!device) {
      throw new AppError('DEVICE_NOT_FOUND', `Device '${deviceId}' not found`, 404);
    }

    return device;
  }

  async updateSecurityMode(deviceId, securityMode) {
    if (!deviceId || typeof deviceId !== 'string') {
      throw new AppError('INVALID_DEVICE_ID', 'Device ID parameter is required', 400);
    }

    if (!securityMode || !ALLOWED_SECURITY_MODES.includes(securityMode)) {
      throw new AppError(
        'INVALID_SECURITY_MODE',
        `securityMode must be either 'ARMED' or 'DISARMED'`,
        400
      );
    }

    const updated = await firebaseService.updateDeviceSecurityMode(deviceId, securityMode);
    return updated;
  }
}

export const devicesService = new DevicesService();
export default devicesService;
