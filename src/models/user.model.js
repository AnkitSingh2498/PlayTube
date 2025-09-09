import mongoose, {Schema} from "mongoose"
import bycrpt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
  userName:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
    email:{
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
    fullName:{
    type: String,
    required: true,
    index: true
  },
    avatar:{
    type: String,    //cloudinary URL
    required: true
  },
    coverImage:{
    type: String,
  },
    password:{
    type: String,
    required: [true, "Password is required"]
  },
    refreshToken:{
    type: String,
  },
  watchHistory:[
    {
      type: Schema.Types.ObjectId,
      ref: "Video"
    }
  ]
},{timestamps: true})

// Middleware
userSchema.pre("save", async function(next){
  if(!this.isModified("password")) return next();

  this.password = bycrpt.hash(this.password, 10)
  next()
})

// Custom methods
userSchema.methods.isPasswordCorrect = async function(password){
  return await bycrpt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = async function(){
  jwt.sign({
    _id: this._id,
    email: this.email,
    username: this.userName,
    fullName: this.fullName
  },
  process.env.ACCESS_TOKEN_SECRET,
  {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRY
  }
)
}

userSchema.methods.generateRefreshToken = async function(){
    jwt.sign({
    _id: this._id,
  },
  process.env.REFRESH_TOKEN_SECRET,
  {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY
  }
)
}

export const User = mongoose.model("User", userSchema)