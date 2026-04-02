import Joi from "joi"
const validation_schema=Joi.object({
     fullName:Joi.string().max(40).required(),
      
    email:Joi.string().email().required(),
    password:Joi.string().required().pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&]).{8,}$')).messages({"string.pattern.base": "Password must be at least 8 chars, include uppercase, lowercase, number, and special character"}),
  
})
export default validation_schema


