import mongoose from "mongoose"

const MONGODB_URI = process.env.MONGODB_URI
const connectToDB = async()=>{
    try{
        await mongoose.connect(MONGODB_URI)
        console.log('DB connected')
    }catch(err){
        console.log(err)
        process.exit(1)
    }
}

export default connectToDB