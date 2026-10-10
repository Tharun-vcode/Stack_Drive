const prisma = require("../config/prisma");

const createFolder = async (req, res) => {
    try{
        const userId = req.user.userId; 
        const {name, parentId} = req.body; 
        if(!name || !name.trim())
        {
            return res.status(400).json({
                success: false, 
                message: "Folder name required. "
            });
        }
        if(!parentId == undefined || !parentId == null)
        {
            const parentfolder = await prisma.folder.findMany({
                where: {
                    id: Number(parentId), 
                    userId: userId
                }
            }); 
            if(!parentfolder)
            {
                return res.status(404).json({
                    success: false, 
                    message: "Parent folder not found. "
                }); 
            }
        }
        const folder = await prisma.folder.create({
            data: {
                name: name.trim(), 
                userId: userId, 
                parentId: parentId !== undefined && parentId !== null ? Number(parentId) : null 
            }
        }); 
        return res.status(201).json({
            success: true, 
            message: "Folder created. ", 
            folder: folder 
        });
    }
    catch(error)
    {
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "Could not create folder. "
        }); 
    }
};

const getFolders = async (req, res) => {
    try{
        const userId = req.user.userId; 
        const folders = await prisma.folder.findMany({
            where: {
                userId: userId
            }, 
            orderBy: {
                createdAt: "asc"
            }
        }); 
        return res.status(200).json({
            success: true, 
            message: "Folder retrieved successfully. ", 
            folders: folders
        }); 
    }
    catch(error){
        console.log(error);
        return res.status(500).json({
            success: false, 
            message: "Could not retrive folders."
        }); 
    }
}; 

module.exports = {
    createFolder, 
    getFolders
};