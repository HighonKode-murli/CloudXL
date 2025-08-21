import mongoose from 'mongoose'

const filePartSchema = new mongoose.Schema({
    provider: {type:String, required: true},
    accountEmail: { type: String, required: true },
    remoteId : {type : String, required : true},
    size : {type : Number,required : true},
    order : {type : Number, required : true}
},{_id : false})

const fileSchema = new mongoose.Schema({
    ownerId : {type : mongoose.Schema.Types.ObjectId, ref : 'User', required : true},
    fileName : {type : String, required : true},
    size : {type : Number, required : true},
    mimeType : {type : String, default : 'application/octet-stream'},
    parts : [filePartSchema],
    createdAt : {type : Date,default : Date.now}
})

export default mongoose.model('File',fileSchema)