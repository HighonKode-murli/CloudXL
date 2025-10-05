import mongoose, { modelNames, mongo } from "mongoose";

const teamMemberSchema = new mongoose.Schema({
    teamId : {type : mongoose.Schema.Types.ObjectId, ref : 'Team', required : true},
    userId : {type : mongoose.Schema.Types.ObjectId, ref : 'User', required : true},
    profile : {type : String, required : true},
    joinedAt : {type : Date, default : Date.now}
})

export default mongoose.model('TeamMember',teamMemberSchema)