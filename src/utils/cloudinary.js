import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

// Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // Upload file to cloudinary
    const result = cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // File has been successfully
    console.log("File uploaded successfully", result.url);
    return result;
  } catch (error) {
    // Remove the locally saved temporary file when upload operation failed.
    fs.unlinkSync(localFilePath);
    return null;
  }
};

export {uploadCloudinary}