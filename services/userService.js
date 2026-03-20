import pool from "../config/db.js";

export const createUser = async ({ fullname, password, email }) => {
  try {
    const { rows } = await pool.query(
      "INSERT INTO users (fullname, password, email) VALUES ($1, $2, $3) RETURNING *",
      [fullname, password, email],
    );
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const findUserById = async (id) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE id = $1", [
      id,
    ]);
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const findUserByEmail = async (email) => {
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    return rows[0];
  } catch (error) {
    console.error(error);
  }
};

export const findUserByEmailOrUsername = async (email, username) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE email = $1 OR username = $2",
      [email, username],
    );
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const findUserByResetToken = async (resetToken) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE reset_password_token = $1 AND reset_password_expire > NOW()",
      [resetToken],
    );
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const findUserByTrustedDevice = async (trustedDevice) => {
  try {
    const { rows } = await pool.query(
      "SELECT * FROM users WHERE EXISTS (SELECT 1 FROM jsonb_array_elements(trusted_devices) AS trusted_device WHERE trusted_device ->> 'token' = $1 AND trusted_device ->> 'expires' > NOW())",
      [trustedDevice],
    );
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};
export const updateUserTrustedDevices = async (userId, trustedDevices) => {
  try {
    const { rows } = await pool.query(
      "UPDATE users SET trusted_devices = $1::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *",
      [JSON.stringify(trustedDevices), userId],
    );
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateUser2FA = async (userId, twoFactorSecret, isMfaActive) => {
  try {
    const { rows } = await pool.query(
      "UPDATE users SET two_factor_secret = $1, is_mfa_active = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [twoFactorSecret, isMfaActive, userId],
    );
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateUserResetToken = async (userId, resetToken, expireDate) => {
  try {
    const { rows } = await pool.query(
      "UPDATE users SET reset_password_token = $1, reset_password_expire = $2, updated_at = NOW() WHERE id = $3 RETURNING *",
      [resetToken, expireDate, userId],
    );
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateUserPassword = async (userId, password) => {
  try {
    const { rows } = await pool.query(
      "UPDATE users SET password = $1,reset_password_token = NULL, reset_password_expire = NULL, trusted_devices = '[]'::jsonb, updated_at = NOW() WHERE id = $2 RETURNING *",
      [password, userId],
    );
    return rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const updateUserLastLogin = async (userId) => {
  try {
    const { rows } = await pool.query(
      "UPDATE users SET last_login = NOW() WHERE id = $1 RETURNING *",
      [userId],
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const findOrCreateGoogleUser = async ({ googleId, email, fullname }) => {
  try {
    const { rows: existing } = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    const user = existing[0];

    if (user) {
      if (user.google_id) {
        return user;
      }

      const { rows: linked } = await pool.query(
        "UPDATE users SET google_id = $1, updated_at = NOW() WHERE email = $2 RETURNING *",
        [googleId, email],
      );
      return linked[0];
    }

    const { rows: created } = await pool.query(
      "INSERT INTO users (email, fullname, google_id, created_at, updated_at) VALUES ($1, $2, $3, NOW(), NOW()) RETURNING *",
      [email, fullname, googleId],
    );
    return created[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};
