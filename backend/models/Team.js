import mongoose, { mongo } from "mongoose";

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

const teamSchema = new mongoose.Schema({
    name : {type : String, required : true},
    adminId : {type : mongoose.Schema.Types.ObjectId, ref : 'User',required : true},
    profiles : [
        {
            type : String,
            default : ['editors','content-writers','tech-devs','cross-section']
        }
    ],
    cloudAccounts : [cloudAccountSchema],
    createdAt : {type : Date, default : Date.now}
})

export default mongoose.model('Team',teamSchema)