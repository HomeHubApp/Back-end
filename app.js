import express from 'express';
import  dotenv  from 'dotenv';

dotenv.config();
import cors from 'cors';
import connectdatabase from './config/db.js';
import auth from './routes/auth.js';
const app=express();
app.use(cors());
app.use(express.json());

app.use("/api/auth",auth)
app.listen(process.env.PORT,()=>{
    console.log(`Server is running on port ${process.env.PORT}`);
});


