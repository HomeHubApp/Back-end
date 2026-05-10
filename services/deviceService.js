import pool from "../config/db.js";

export const findDeviceById = async (deviceId, userId) => {
  try {
    const { rows } = await pool.query(
      "SELECT d.* FROM devices d JOIN homes h ON d.home_id = h.id WHERE d.id = $1 AND h.user_id = $2 AND d.is_active = TRUE",
      [deviceId, userId],
    );
    return rows[0] || null;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const toggleDevice = async (deviceId) =>{
    try{
        const {rows} = await pool.query(      `INSERT INTO device_status (device_id, status_type, status_value, recorded_at)
       VALUES ($1, 'on_off', '1', NOW())
       ON CONFLICT (device_id, status_type)
       DO UPDATE SET
         status_value = CASE
           WHEN device_status.status_value = '1' THEN '0'
           ELSE '1'
         END,
         recorded_at = NOW()
       RETURNING *`,
       [deviceId]);
           await pool.query(
      "UPDATE devices SET updated_at = NOW() WHERE id = $1",
      [deviceId]
    );
    return rows[0];
    }
    catch(error){
        console.error(error);
        throw error;
    }
}
