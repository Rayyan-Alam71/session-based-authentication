import type { Request, Response } from "express";
import { redis } from "./lib/redis.js";

export const auth = async (req : Request, res : Response, next : any) =>{
    
    const sessionId = req.headers.cookie?.split("=")[1]

    // check if the session persists 
    const sessionFound = await redis.get(`session:${String(sessionId)}`)

    if(!sessionFound){
        return res.send('no session found')
    }
    // @ts-ignore
    req.user = JSON.parse(sessionFound)
    next()
}