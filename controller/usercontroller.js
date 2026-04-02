import bcrypt from 'bcrypt';    
import usermodel from '../model/Usermodel.js';
import validation_schema from '../model/validation.js';
import pool from '../config/db.js';
import User from '../services/userservice.js';


export default  async function createusercontroller(req,res){
const {error,value}=validation_schema.validate(req.body);


if (error) {
    return res.status(400).json({ message: error.details[0].message });
 
}


try{
const checkuser=await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [value.email]
    );

if(checkuser.rows.length > 0){
 
    return res.status(400).json({message:"User already exists"})
    
}
const salt=await bcrypt.genSalt(10)
const hashpassword=await bcrypt.hash(value.password,salt)
const userservice=new User(value.fullName,value.email,hashpassword)
const createduser= await  userservice.createuser()

return res.status(201).json({message:"User created successfully",user:createduser}) 

} 
catch(error){
   
    console.error(error);
    res.status(500).json({ message: "Account creation failed" });
}





}