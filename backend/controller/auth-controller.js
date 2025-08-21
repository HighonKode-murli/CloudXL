import User from '../models/User.js'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'

export async function Signup(req,res){
    try{
        const {email,password} = req.body
        if(!email || !password) return res.status(400).json({error : 'email/password/username required'})
        const isUserExits = await User.findOne({email})
        if(isUserExits){
            return res.status(400).json({
                success : false,
                message : 'email already exists'
            })
        }
        const salt = await bcrypt.genSalt(10)
        const hashedPass = await bcrypt.hash(password,salt)

        await User.create({
            email,
            passwordHash : hashedPass,
            cloudAccounts : []
        })

        return res.status(200).json({
            success : true,
            message : 'Signup successful'
        })

    }catch(err){
        console.error('Signup error : ',err)
        res.status(400).json({
            success : false,
            message : 'Error, try again'
        })
    }
}

export async function Login(req,res){
    try{
        const {email,password} = req.body
        const user = await User.findOne({email})
        if(!user){
            return res.status(404).json({
                success : false,
                message : 'User not found'
            })
        }



        const passMatch = await bcrypt.compare(password,user.passwordHash)
        if(!passMatch) {
            return res.status(400).json({
                success : false,
                message : 'Invalid Credentials'
            })
        }

        const accessToken = jwt.sign({
            userId : user._id,
        }, process.env.JWT_SECRET_KEY,{
        expiresIn : '7d'
        })

        res.status(200).json({
            success : true,
            message : 'login successful',
            accessToken
        })

    }catch(err){
        console.log(err)
        res.status(400).json({
            success : false,
            message : 'Error, try again'
        })
    }
}


