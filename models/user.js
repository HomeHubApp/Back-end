import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isMfaActive: {
      type: Boolean,
      required: false,
    },
    verificationToken: {
      type: String,
    },

    resetPasswordToken: {
      type: String,
      required: false,
    },
    resetPasswordExpire: {
      type: Date,
    },

    twoFactorSecret: {
      type: String,
      required: false,
    },

        trustedDevices: {
      type: [
        {
          token: { type: String },
          expires: { type: Date },
        }
      ],
      default: [],
    }},
  { timestamps: true },
);

const User = mongoose.model("User", userSchema);
export default User;
