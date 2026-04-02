import mongoose from "mongoose";
const optschema=new mongoose.Schema({
    otp:{
        type:String,
        required:true   
    },
   
    email:{
        type:String,
        required:true, 
        unique:true
    },

     expiresAT:{
        type:Date,
        required:true,
        index: { expires:0 }
         
    },
    





})
const otpmodel=mongoose.model("otp",optschema);
export default otpmodel;

