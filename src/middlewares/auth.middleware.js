import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken";



export const verifyJWT = asyncHandler(async (req, _, next) => {   // can use _ in place of res(unused parameter)
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
  
    if (!token) throw new ApiError(401, "Unauthorized request");
  
    const decodedToken = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );
    if (!user) throw new ApiError(401, "Invalid token");
  
    req.user = user;
    next()
  } catch (error) {
    throw new ApiError(401, error?.message || "Invlid access token")
  }
});
