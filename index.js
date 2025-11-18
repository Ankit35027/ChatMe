const {PrismaClient} = require("./generated/prisma")
const prisma = new PrismaClient()
const express = require("express")
const app = express()
const CookieParser = require("cookie-parser")
const jwt = require("jsonwebtoken")
 const cors = require("cors")

app.use(cors({
    origin: "http://localhost:5173",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }))



const bcrypt = require("bcrypt")
app.use(express.json())
app.use(express.urlencoded({extended:false}))
app.use(CookieParser())



const middleWare = (req,res,next)=>{
    const tok =  req.cookies.token
    if(!tok){
        res.json({message:"Plzz SignIn"})
    }else{
        jwt.verify(tok,"23###23",(err,result)=>{
            if(result){
                req.user = result
                next()
            }else{
                res.json({message:"Plzzz Sign In"})
            }
        })
    }

}
app.use("/dashboard",middleWare)


app.get("/dashboard",(req,res)=>{
    res.status(200).json({message:"Everything is fine"})
})

app.post("/SignUp",async (req,res)=>{
    const {username,email,password} = req.body
    if(!username || !email || !password){
        return res.status(400).json({"message":"All fields are required"})
    }
    const data = await prisma.user.findUnique({
        where:{email:email}




    })
    const usernameData = await prisma.user.findFirst({
        where:{username:username}
    })
    if(usernameData){
        return res.status(400).json({message:"User Already Exist With This Mail or Username"})
    }
    if(!data){
        const pass = await bcrypt.hash(password,10)
        const dat = await prisma.user.create({
            data:{
                username,
                email,
                password:pass
            }
        })
        res.status(201).json({message:"Created Successfully"})
    }else{
        res.status(400).json({message:"User Already Exist With This Mail or Username"})
    }
})

app.post("/SignIn", async (req,res)=>{
    const user = req.body
    if(!user.username || !user.password){
        res.status(400).json({message:"All fields are required to fill"})
    }
    const d1 = await prisma.$queryRaw`
        select * from User where username = ${user.username} or email = ${user.username};
        `
    console.log(d1)
    if(d1.length==0){
        res.status(400).json({message:"user not Exists Sign In again"})
    }
    else{
        const passw = d1[0].password
        bcrypt.compare(user.password,passw,(err,result)=>{
            if(result){
                const token = jwt.sign({email:d1[0].email},"23###23",{expiresIn:"24h"})
                res.cookie("token",token,{
                    httpOnly: true,      
                    sameSite: "none",
                    maxAge: 24 * 60 * 60 * 1000,
                    secure:false      
                  })
                res.status(200).json({message:"Successfully Login"})
            }else{
                res.status(409).json({message:"Invalid Username or Password"})
            }
        })
    }
    

})


app.listen(3000,()=>{
    console.log("server working fine")
})