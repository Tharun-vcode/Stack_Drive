const jwt = require("jsonwebtoken");
const authMiddleware = (req, res, next) => {
    try{
        const authheader = req.headers.authorization; 
        if(!authheader)
        {
            return res.status(401).json({
                success: false, 
               message: "Invalid fucking header."
           }); 
        }
        const token = authheader.split(" ")[1]; 
        const decode = jwt.verify(
        token, process.env.jwt_secret
        );
        req.user = decode; 
        next();
    }
    catch(error){
        console.log(error); 
        return res.status(401).json({
            success: false, 
            message: "Invalid token or expiration."
        }); 
    }
}; 

module.exports = authMiddleware; 
