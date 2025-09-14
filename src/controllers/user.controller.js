import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  //Step:1 get user details from frontend
  //Step:2 Validation
  //Step:3 Check if user already exists
  //Step:4 Check for images, check for avatar
  //Step:5 Upload them to cloudinary, avatar
  //Step:6 create user object - create entry in db
  //Step:7 remove password and refresh token field from response
  //Step:8 check for user creation
  //Strp:9 return response

  const { userName, email, fullName, password } = req.body;
  /*
    if(fullName ==="")
      throw new ApiError(400,"Field is required")
    */

  // Checking required fields in request
  if (
    [userName, email, fullName, password].some((fields) => fields?.trim === "")
  )
    throw new ApiError(400, "* fields are required.");
  // Check if user exists in DB
  const existedUser = User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser)
    throw new ApiError(409, "User with email or username exists");

  // Avatar and CoverImage validation and upload
  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required.");

  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!avatar) throw new ApiError(400, "not uploaded");

  // Create user in DB
  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    userName: userName.toLowerCase(),
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser)
    throw new ApiError(500, "Something went wrong while creating user.");

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Successfully"));
});

export { registerUser };
