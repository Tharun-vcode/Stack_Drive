const express = require("express"); 
const cors = require("cors"); 
const app = express(); 
const helmet = require("helmet"); 
const prisma = require("./config/prisma"); 
const tokenBucket = require("./middleware/rateLimitMiddleware"); 
const authroutes = require("./routes/authRoutes");
const fileRoutes = require("./routes/fileRoutes"); 
const folderRoutes = require("./routes/folderRoutes"); 
app.use(helmet()); 
app.use(cors()); 
app.use(
    "/api/files/webhook", 
    express.raw({ type: "application/json" })
); 
app.use(express.json()); 
app.use(express.urlencoded({ extended: true})); 
app.use(tokenBucket); 
app.get("/", (req, res) => {
    res.json({
        success: true, 
        message: "file management api is running"
    })
}); 
app.get("/test-db", async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`; 
        res.json({
            success: true, 
            message: "Database connection is successful"
        }); 
    }
    catch(error){
        console.log(error); 
        res.status(500).json({
            success: false, 
            message: "Database connection failed"
        })
    }
}); 

app.use("/api/auth", authroutes); 
app.use("/api/files", fileRoutes); 
app.use("/api/folders", folderRoutes); 

module.exports = app; 