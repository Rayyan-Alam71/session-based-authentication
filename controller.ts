import bcrypt from "bcrypt"
import { prisma } from "./lib/prisma.js";
import {v4 as uuid} from "uuid"
import { redis } from "./lib/redis.js";
import type { Request, Response } from "express";



export const signupController = async (req : Request, res : Response)=>{
    const { name, email, password } = req.body;

    // validate entries
    if(!name || !email || !password){
        return res.send('invalid credentials')
    }

    // check if the user exixts with the same email

    const userFound = await prisma.user.findFirst({
        where: {
            email 
        }
    })

    if(userFound){
        return res.send('User already exists with this email')
    }

    // hash the original password
    const hashedPassword = await bcrypt.hash(password, 10)

    const user = await prisma.user.create({
        data : {
            name,
            email,
            hashedPassword
        },
        select : {
            name : true,
            email : true,
            createdAt : true
        }
    })

    if(!user){
        return res.send('user not created')
    }

    return res.status(200).json({
        success : true,
        msg : 'user created successfully',
        data : user
    })
    
}

export const loginController = async (req : Request, res : Response) =>{
    const { email, password} = req.body;

    // validate the field
    if(!email || !password) {
        return res.send('invalid credentials')
    }

    // check if the user exists
    const userFound = await prisma.user.findFirst({
        where : {
            email
        },
        select:{
            name : true,
            email : true,
            hashedPassword: true,
            id : true
        }
    })

    if(!userFound){
        return res.send('No user found with this credentials')
    }

    // check the password
    const isValidated = await bcrypt.compare(password, userFound.hashedPassword)

    if(!isValidated){
        return res.send('incorrect password')
    }
    
    // create a session and store in the redis

    // create a session id
    const sessionId = uuid()

    console.log(sessionId)

    await redis.set(`session:${String(sessionId)}`, JSON.stringify({userId : userFound.id}), { EX : 24 * 60 * 60 })

    res.cookie("sid", sessionId, {
        httpOnly : true,
        secure : false,
        sameSite : "lax",
        expires : new Date(Date.now() + 24 * 60 * 60 * 1000)
    } )

    return res.status(200).json({
        success : true,
        msg : 'login successfull',
    })
}

export const getTodosController =async (req : Request, res : Response) =>{
    // @ts-ignore
    const { userId} = req.user

    // check for the todos in the db for this user

    const todosFound = await prisma.todo.findMany({
        where : {
            userId
        },
        select : {
            task : true,
            description : true,
            createdAt : true
        }
    })

    if(!todosFound) {
        return res.send('no todos found')
    }

    return res.status(200).json({
        success : true,
        msg : 'todos found',
        data : todosFound
    })
    return res.send('done')
}

export const addTodoController = async (req : Request, res : Response) =>{
    
    // @ts-ignore
    const { userId } = req.user

    const {task, description} = req.body

    if(!task || !description) {
        return res.send('invalid todo field')
    }
    const createTodo = await prisma.todo.create({
        data : {
            userId,
            task,
            description
        },
        select : {
            task : true,
            description : true,
            createdAt : true
        }
    })

    if(!createTodo){
        return res.send('todo not created')
    }

    return res.status(200).json({
        success : true,
        msg : 'todo created successfully',
        data : createTodo
    })
}

export const logoutController = async (req : Request, res : Response) => {

    // check if this user has an open session

    // check the redis for this session
    const sessionId = req.headers.cookie?.split("=")[1]

    const sessionFound = await redis.get(`session:${sessionId}`)

    if(!sessionFound){
        return res.send('no session found')
    }

    await redis.del(`session:${sessionId}`)
    res.clearCookie("sid")
    return res.status(200).json({
        success : true,
        msg : 'logout successfully'
    })
}   
