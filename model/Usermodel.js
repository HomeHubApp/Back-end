
import mongoose from "mongoose";
const userschema=new mongoose.Schema({
    Firstname:{
        type:String,
        required:true   
    },
    Lastname:{
        type:String,
        required:true   
    },
    email:{
        type:String,
        required:true, 
        unique:true
    },
password:{      
        type:String,
        required:true   
    },

Phone_number:{      
        type:String,
        required:true   
    },

     isVerified: { type: Boolean, default: false }




})
const usermodel=mongoose.model("User",userschema);
export default usermodel;
