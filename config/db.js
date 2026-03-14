import mongoose from "mongoose";

const dbConnect = async () =>{
    try{
        const mongoDbConnection = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`connected to ${mongoDbConnection.connection.host}`);
    }
    catch(error){
        console.log(`failed: ${error}`);
        process.exit(1);
    }
}

export default dbConnect;