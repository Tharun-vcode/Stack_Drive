const buckets = new Map(); 
const capacity = 5; 
const refill_rate = 0.1; 
const request_cost = 1; 
const tokenbucket = (req, res, next) => {
    const clientId = req.ip; 
    let bucket = buckets.get(clientId); 
    if(!bucket)
    {
        bucket = {
            tokens: capacity, 
            lastRefill: Date.now()
        }; 
        buckets.set(clientId, bucket); 
    }
    const now = Date.now(); 
    const elapsedTime = (now - bucket.lastRefill) / 1000; 
    const refilltoken = elapsedTime * refill_rate; 
    bucket.tokens = Math.min(
        capacity, 
        bucket.tokens + refilltoken
    ); 

    bucket.lastRefill = now; 
    if(bucket.tokens < request_cost)
    {
        return res.status(429).json({
            success: false, 
            Message: "Too many requests."
        }); 
    }

    bucket.tokens -= request_cost; 
    next(); 
}; 

module.exports = tokenbucket; 