const prisma = require("../config/prisma");
const cloudinary = require("../config/cloudinary");
const sniffMimeType = require("../utils/mimeSniffer"); 
const notificationurl =   "https://cf9a-2401-4900-cccb-b307-2c91-1ac2-afaa-6645.ngrok-free.app/api/files/webhook";
const crypto = require("crypto");
const mime = require("mime-types"); 
const { resource } = require("../app");
const uploadFile = async (req, res) => {
    try{
        const { 
            originalName, 
            publicId, 
            url, 
            mimeType, 
            size, 
            resourceType, 
            folderId
         } = req.body; 
         if(folderId !== undefined && folderId !== null){
            const folder = await prisma.folder.findFirst({
                where: {
                    id: Number(folderId), 
                    userId: req.user.userId
                }
            }); 
            if(!folder)
            {
                return res.status(404).json({
                    success: false, 
                    message: "Folder not found."
                }); 
            }
         }
         if(!originalName || !publicId || !url || !mimeType || !size || !resourceType){
            return res.status(400).json({
                success: false,
                message: "All file fields are required."
            });
        }

        const userId = req.user.userId; 
        const file = await prisma.file.create({
            data: {
                originalName: originalName,
                publicId: publicId,
                url: url,
                mimeType: mimeType,
                size: size,
                resourceType: resourceType,
                folderId, 
                userId: userId
            }
        }); 
        return res.status(201).json({
            success: true, 
            message: "File uploaded successfully. ", 
            file: {
                id: file.id, 
                originalName: file.originalName, 
                url: file.url, 
                mimeType: file.mimeType, 
                size: file.size, 
                resourceType: file.resourceType, 
                folderId: file.folderId, 
                createdAt: file.createdAt
            }
        });
    }
    catch (error) {
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "File upload went fucking wrong."
        }); 
    }
}; 

const uploadSignature = async (req, res) => {
    try{
        const{ folderId } = req.body; 
        const userId = req.user.userId; 
        if(folderId !== undefined && folderId !== null)
        {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: Number(folderId), 
                    userId: userId
                }
            }); 
            if(!folder)
            {
                return res.status(404).json({
                    success: false, 
                    message: "Folder not found."
                });
            }
        }
        const timestamp = Math.round( new Date().getTime() / 1000); 
        const folder = `file-management/users/${userId}`; 
        const uploadparam = {
            timestamp: timestamp, 
            folder: folder, 
            context: `userId=${userId}|folderId=${folderId || ""}`, 
            notification_url: notificationurl

        }
        const signature = cloudinary.utils.api_sign_request(
            uploadparam, 
            process.env.CLOUDINARY_API_SECRET
        ); 

        return res.status(200).json({
            success: true, 
            timestamp: timestamp, 
            signature: signature, 
            cloudname: process.env.CLOUDINARY_CLOUD_NAME, 
            apikey: process.env.CLOUDINARY_API_KEY,
            folder: folder, 
            context: uploadparam.context, 
            notification_url: notificationurl
        }); 
    } 

    catch(error){
        console.log(error); 
        return res.status(500).json({
            success: false,
            message: "Could not generate upload signature. "
        }); 
    }
}; 

const getFiles  = async (req, res) => {
    try{
        const userId = req.user.userId; 
        const {
            search, 
            mimeType, 
            minSize, 
            maxSize, 
            folderId, 
            sort = "createdAt", 
            order = 'desc', 
            page = 1, 
            limit = 10
        } = req.query; 

        const pageNumber = parseInt(page); 
        const limitNumber = parseInt(limit); 
        if(isNaN(pageNumber) || pageNumber < 1){
            return res.status(400).json({
                success: false, 
                message: "Invalid page number."
            }); 
        }
        if(isNaN(limitNumber) || limitNumber < 1 || limitNumber > 100){
            return res.status(400).json({
                success: false, 
                message: "Invalid limit number."
            }); 
        }; 
        const where = {
            userId: userId
        }; 
        if(search){
            where.originalName = {
                contains: search, 
                mode: "insensitive"
            }
        }; 
        if(mimeType){
            where.mimeType = mimeType; 
        }; 
        if(minSize || maxSize){
            where.size = {}; 
            if(minSize)
            {
                where.size.gte = Number(minSize); 
            }
            if(maxSize){
                where.size.lte = Number(maxSize); 
            }
        }
        if(folderId !== undefined)
        {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: Number(folderId), 
                    userId: userId
                }, 
            });
            if(!folder){
                return res.status(404).json({
                    success: false, 
                    message: "Folder not found. "
                });
            }
            where.folderId = Number(folderId);
        }
        const allowedSortFields = ["createdAt", "originalName", "size", "mimeType"]; 
        if(!allowedSortFields.includes(sort)){
            return res.status(400).json({
                success: false, 
                message: "Invalid sort field."
            }); 
        }
        if(order !== "asc" && order !== "desc"){
            return res.status(400).json({
                success: false, 
                message: "Invalid order field."
            }); 
        }
        const skip = (pageNumber - 1) * limitNumber; 
        const [files, totalCount] = await Promise.all([
            prisma.file.findMany({
                where: where, 
                orderBy: {
                    [sort]: order
                }, 
                skip: skip, 
                take: limitNumber
            }), 
            prisma.file.count({
                where: where
            })
        ]); 
        return res.status(200).json({
            success: true, 
            files: files, 
            pagination: {
                page: pageNumber, 
                limit: limitNumber, 
                totalFiles: totalCount,
                totalPages: Math.ceil(totalCount / limitNumber) 
            }
        }); 

    }
    catch(error)
    {
        console.log(error);
        return res.status(500).json({
            success: false, 
            message: "Could not retrive files."
        }); 
    }
}; 

const getFileId  = async (req, res) => {
    try{
        const fileId = Number(req.params.id); 
        const userId = req.user.userId; 
        if(isNaN(fileId)){
            return res.status(400).json({
                success: false, 
                message: "Incorrect file id."
            })
        }
        const file = await prisma.file.findFirst({
            where: {
                id: fileId, 
                userId: userId
            }
        }); 
        if(!file){
            return res.status(404).json({
                success: false, 
                message: "File not found. "
            }); 
        }
        return res.status(200).json({
            success: true, 
            file: file
        }); 
    }
    catch(error){
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "could not fetch file."
        }); 
    }
}

const deleteFile = async (req, res) => {
    try{
        const fileId = Number(req.params.id);
        const userId = req.user.userId; 
        if(isNaN(fileId))
        {
            return res.status(400).json({
                success: false, 
                message: "No file."
            }); 
        }
        const file = await prisma.file.findFirst({
            where: {
                id: fileId, 
                userId: userId
            }
        }); 
        if(!file){
            return res.status(404).json({
                success: false, 
                message: "File not found. "
            }); 
        }
        const cloudinaryResult = await cloudinary.uploader.destroy(file.publicId, {
            resource_type: file.resourceType
        });
        console.log(cloudinaryResult); 
        if(cloudinaryResult.result !== "ok") {
            return res.status(500).json({
                success: false, 
                message: "Could not delete file from cloudinary. "
            }); 
        }
        await prisma.file.delete({
            where: {
                id: file.id
            }
        }); 
        return res.status(200).json({
            success: true, 
            message: "File deleted successfully. "
        })
    }
    catch(error){
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "Could not delete file."
        }); 

    }
}

const updateFile = async (req, res) => {
    try{
        const fileId = Number(req.params.id);
        const userId = req.user.userId;
        if(isNaN(fileId)){
            return res.status(400).json({
                success: false, 
                message: "incorrect file id."
            }); 
        }
        const file = await prisma.file.findFirst({
            where: {
                id: fileId, 
                userId: userId
            }
        });
        if(!file){
            return res.status(404).json({
                success: false,
                message: "File not found."
            }); 
        }
        const { originalName, folderId } = req.body;
        if(originalName == undefined && folderId == undefined){
            return res.status(400).json({
                success: false, 
                message: "File name is required."
            });
        }

        if(folderId !== undefined && folderId !== null)
        {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: Number(folderId), 
                    userId: userId 
                }
            });
            if(!folder)
            {
                return res.status(404).json({
                    success: false, 
                    message: "Folder not found."
                }); 
            }
        }

        const data = {}; 

        if(originalName !== undefined){
            if(!originalName.trim())
            {
                return res.status(400).json({
                    success: false, 
                    message: "File name cannot be empty."
                }); 
            }
            data.originalName = originalName.trim(); 
        }

        if(folderId !== undefined)
        {
            data.folderId = folderId == null ? null : Number(folderId);
        }

        const updatedFile = await prisma.file.update({
            where: {
                id: file.id
            }, 
            data: data
            
        }); 
        return res.status(200).json({
            success: true, 
            message: "File updated successfully.", 
            file: updatedFile
        }); 
    }
    catch(error){
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "Could not uupdate file."
        }); 
    }
}; 

const downloadFile = async (req, res) => {
    try{
        const fileId = Number(req.params.id);
        const userId = req.user.userId;
        if(isNaN(fileId)){
            return res.status(400).json({
                success: false, 
                message: "incorrect file id."
            }); 
        }
        const file = await prisma.file.findFirst({
            where: {
                id: fileId, 
                userId: userId
            }
        });
        if(!file){
            return res.status(404).json({
                success: false,
                message: "File not found."
            }); 
        }
        return res.status(200).json({
            success: true, 
            file: file.url
        }); 
    }
    catch(error){
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "Could not uupdate file."
        }); 
    }
}; 

const cloudinaryWebhook = async (req, res) => {
    try{
        const signature = req.headers["x-cld-signature"];
        const timestamp = req.headers["x-cld-timestamp"];
        if(!signature || !timestamp)
        {
            return res.status(401).json({
                success: false, 
                message: "Missing cloudinary webhook signature."
            }); 
        }
        const currenttime = Math.floor(Date.now() / 1000); 
        const webhooktime = Number(timestamp);
        const timestampdifference = Math.abs(currenttime - webhooktime); 
        if(timestampdifference > 300)
        {
            return res.status(401).json({
                success: false, 
                message: "Webhook timestamp is too old."
            }); 
        }
        const rawBody = req.body; 
        const expectedSignature = crypto
        .createHash("sha1")
        .update(
            Buffer.concat([
                rawBody, 
                Buffer.from(timestamp), 
                Buffer.from(process.env.CLOUDINARY_API_SECRET)
            ])
        )
        .digest("hex"); 
        if(signature !== expectedSignature)
        {
            return res.status(401).json({
                success: false, 
                message: "Invalid cloudinary webhook signature."
            }); 
        }
        console.log("Cloudinary Webhook received.");
        const payload = JSON.parse(rawBody.toString("utf8")); 
        const publicId = payload.public_id; 
        const format = payload.format; 
        const resourceType = payload.resource_type; 
        const signedURL = cloudinary.utils.private_download_url(
            publicId,
            format, 
            {
                resource_type : resourceType, 
                type: payload.type || "upload", 
                expires_at: Math.floor(Date.now() / 1000) + 300
            }
        ); 
        console.log("Signed URL is generated");
        const detectedType = await sniffMimeType(signedURL);
        console.log("Detected MIME Type", detectedType);
        const expectedMIMEtype = mime.lookup(format);
        if(!detectedType || !expectedMIMEtype)
        {
            return res.status(400).json({
                success: false, 
                message: "Failed to Validate."
            }); 
        }
        if(detectedType.mime != expectedMIMEtype)
        {
            return res.status(400).json({
                success: false, 
                message: "Unable to match given file type to actual file type."
            }); 
        }
        const userId = Number(payload.context?.custom?.userId); 
        const folderId = payload.context?.custom.folderId ? Number(payload.context.custom.folderId): null;
        if(!userId || Number.isNaN(userId))
        {
            return res.status(400).json({
                success: false, 
                message: "Invalid user id for webhook."
            }); 
        }
        if(folderId != null && Number.isNaN(folderId))
        {
            return res.status(400).json({
                success: false, 
                message: "Invalid folder id for webhook."
            });
        }
        console.log("UserId: ", userId); 
        console.log("FolderId: ",  folderId); 
        if(folderId != null)
        {
            const folder = await prisma.folder.findFirst({
                where: {
                    id: folderId, 
                    userId: userId
                }
            }); 
            if(!folder)
            {
                return res.status(400).json({
                    success: false, 
                    message: "Folder not found."
                })
            }
            console.log("Folder ownership verified."); 
        }
        const existingfile = await prisma.file.findUnique({
            where: {
                publicId: publicId
            }
        });
        const file = await prisma.file.upsert({
            where: {
                publicId: publicId
            }, 
            update: {
                originalName: payload.original_filename, 
                url: payload.secure_url, 
                mimeType: detectedType.mime, 
                size: payload.bytes,
                resourceType: resourceType,
                userId: userId, 
                folderId: folderId, 
            }, 
            create: {
                originalName: payload.original_filename, 
                publicId: publicId, 
                url: payload.secure_url, 
                mimeType: detectedType.mime, 
                size: payload.bytes,
                resourceType: resourceType,
                userId: userId, 
                folderId: folderId, 
            }
        }); 
        if(existingfile)
        {
            console.log("Existing file found webhook processed as update: ", file.id);
        }
        else 
        {
            console.log("file registered successfully in DB: ", file.id); 
        }
        console.log("Webhook Body", payload);
        return res.status(200).json({
            success: true, 
            message: "Webhook received."
        }); 
    }
    catch(error){
        console.log(error); 
        return res.status(500).json({
            success: false, 
            message: "Webhook processing failed."
        }); 
    }
}; 

module.exports = {
    uploadFile, 
    uploadSignature, 
    getFiles, 
    getFileId, 
    deleteFile, 
    updateFile, 
    downloadFile,
    cloudinaryWebhook 
};