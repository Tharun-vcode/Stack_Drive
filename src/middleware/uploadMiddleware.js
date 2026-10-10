const multer = require("multer");
const path = require("path"); 
const storage = multer.diskStorge({
    destination: function(req, file, cb){
        cb(null, "storage/"); 
    }, 
    filename: function(req, file, cb){
        const uniqueName = Date.now() + "-" + Math.round(Math.random() * 1E9); 
        cb(null, uniqueName + path.extname(file.originalname)); 
    }
}); 

const upload = multer({
    storage: storage
}); 
 
module.exports = upload; 

