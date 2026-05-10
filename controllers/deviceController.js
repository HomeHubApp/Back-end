import { findDeviceById, toggleDevice } from "../services/deviceService.js";

export const toggle = async (req, res) => {
  try {
    const deviceId = req.params.id;

    if (!deviceId) {
      return res.status(400).json({
        success: false,
        message: "Device ID is required",
      });
    }

    const device = await findDeviceById(deviceId, req.user.id);
    if (!device) {
      return res.status(404).json({
        success: false,
        message: "Device not found",
      });
    }

    const status = await toggleDevice(deviceId);

    return res.status(200).json({
      success: true,
      message: `Device turned ${status.status_value === "1" ? "on" : "off"}`,
      deviceId: device.id,
      isOn: status.status_value === "1",
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Error toggling device",
    });
  }
};
