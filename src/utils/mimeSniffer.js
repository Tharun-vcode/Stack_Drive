const sniffMimeType = async(url) => {
    const{ fileTypeFromBuffer } = await import("file-type"); 
    const response = await fetch(url, {
        headers: {
            Range: "bytes=0-4099"
        }
    }); 
    if(!response.ok)
    {
                console.log("Status:", response.status);
                console.log("Status text:", response.statusText);
                console.log("Content-Type:", response.headers.get("content-type"));
        throw new Error("Could not fetch file for MIME detection. "); 
    }
    const arrayBuffer = await response.arrayBuffer(); 
    const buffer = Buffer.from(arrayBuffer); 
    const detectedType = await fileTypeFromBuffer(buffer); 
    return detectedType; 
}; 
module.exports = sniffMimeType; 