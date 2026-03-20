const trustedDeviceProtect = async (req, res, next) => {
  const deviceToken = req.cookies?.trustedDevice;
  if (!deviceToken) return res.status(401).json({ message: "Device not trusted" });

  const user = await User.findOne({ "trusted_devices.token": deviceToken });
  if (!user) return res.status(401).json({ message: "Device not trusted" });

  req.user = { _id: user._id, username: user.username };
  next();
};
export default trustedDeviceProtect;