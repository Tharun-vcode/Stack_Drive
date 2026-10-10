const bcrypt = require("bcrypt"); 
const jwt = require("jsonwebtoken"); 
const prisma = require("../config/prisma"); 
const register = async (req, res) => {
    try{
        const {name, email, password} = req.body;
        if(!name || !email || !password)
        {
            return res.status(400).json({
                success: false,
                message: "Name, password, email is required. "
            })
        }

        const existinguser = await prisma.user.findUnique({
    where: {
        email:email
    }
}); 

if(existinguser){
    return res.status(409).json({
        success: false, 
        message: "User already exists. "
    }); 
}

const hashpass = await bcrypt.hash(password, 10); 

const user = await prisma.user.create({
    data: {
        name: name, 
        email: email,
        password: hashpass, 
    }
}); 

res.status(201).json({
    success: true, 
    message: "User successfully created", 
    user: {
        id: user.id, 
        name: user.name, 
        email: user.email 
    }
}
)
    }
    catch (error){
        console.log(error); 
        res.status(500).json({
                success: false,
                message: "fuckkkk"
            }
        ); 
    }
}; 

const login = async(req, res) => {
    try {
        const {email, password} = req.body; 
        if(!email || !password){
            return res.status(400).json({
                    success: false, 
                    message: "Email and password fucking needed. "
                }
            );
        }
        const user = await prisma.user.findUnique(
            {
                where: {
                    email: email
                }
            }
        )

        if(!user){
            return res.status(404).json({
                success: false, 
                message: "user not fucking found"
            }); 
        }
        
        const passcom = await bcrypt.compare(password, user.password); 
        if(!passcom){
            return res.status(401).json({
                success: false, 
                message: "Invalid password"
            }); 
        }

        const token = jwt.sign(
            {
                userId: user.id, 
            }, 
            process.env.jwt_secret,
            {
                expiresIn:"1h"
            }
        );

        return res.status(200).json({
            success: true, 
            message: "login successful", 
            token: token, 
            user: {
                id: user.id, 
                userid : user.name, 
                email: user.email, 
            }
        }); 
    }
    catch(error){
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "something went fucking error"
        }); 
    }
}; 

const getme = async(req, res) => {
    try{
        const user = await prisma.user.findUnique({
        where: {
            id: req.user.userId 
        }, 
        select: {
            id: true, 
            name: true, 
            email: true, 
            createdAt: true
        }
        });
        if(!user)
        {
            return res.status(404).json({
                success: false, 
                message: "Incorrect fucking user. "
            }); 
        }
        res.status(200).json({
            success: true, 
            user: user
        }); 
        }
    catch(error){
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "Something went fucking wrong."
        }); 
    }
}; 

module.exports = {
    register, 
    login, 
    getme
}