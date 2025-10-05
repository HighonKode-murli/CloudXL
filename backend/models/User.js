import mongoose from "mongoose";

const cloudAccountSchema = new mongoose.Schema(
  {
    provider: { type: String, enum: ["google", "dropbox"], required: true },
    accountEmail: { type: String, required: true }, // unique per provider
    accessToken: { type: String, required: true },
    refreshToken: { type: String, required: true },
    expiresAt: { type: Date, required: true },
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true },
    passwordHash: { type: String, required: true },
    role : {type : String, enum : ['user','admin'], default : 'user'},
    cloudAccounts: [cloudAccountSchema],
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
