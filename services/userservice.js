import usermodel from "../model/Usermodel.js"
import pool from '../config/db.js';
class User{
    constructor(fullName,email,password){
        this.fullName=fullName
        this.email=email
        this.password=password
    }
    async createuser(){
   
    // const saveduser=await createuser.save({session})
    // return saveduser
    const saveduser=await pool.query('INSERT INTO users (fullname,  email,  password) VALUES ($1, $2, $3) RETURNING *', [this.fullName, this.email, this.password]);
    }

    // async verifyemail(otp){
    //   const otp=  
    // }
}
export default User