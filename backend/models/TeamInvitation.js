import mongoose from "mongoose";

const teamInvitationSchema = new mongoose.Schema({
    teamId : {type : mongoose.Schema.Types.ObjectId, ref : 'Team', required : true},
    email : {type : String, required : true},
    profile : {type : String, required : true},
    inviteToken : {type : String, required : true, unique : true},
    status : {type : String , enum : ['pending','accepted','rejected','expired'], default : 'pending'},
    expiresAt : {type : Date, required : true}
}, { timestamps: true })

export default mongoose.model('TeamInvitation', teamInvitationSchema)