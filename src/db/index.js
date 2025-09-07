import mongoose from "mongoose"
import { DB_NAME } from "../constants.js";

const connectDB = async()=>{
  try {
    const conrrctionInstance  = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`MondoDB connected ! DB HOST: ${conrrctionInstance.connection.host}`);

  } catch (error) {
    console.error("Error: ", error)
    process.exit(1)
  }
}
export default connectDB;