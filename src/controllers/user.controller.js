import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // It will not give error because we are saving only refresh token not whole object.

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wronmg while generating token");
  }
};

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
  const existedUser = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (existedUser)
    throw new ApiError(409, "User with email or username exists");

  // Avatar and CoverImage validation and upload
  const avatarLocalPath = req.files?.avatar[0]?.path;
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage && req.files.coverImage[0].length > 0)
  )
    coverImageLocalPath = req.files.coverImage[0].path;

  if (!avatarLocalPath) throw new ApiError(400, "Avatar file is required.");

  const avatar = await uploadCloudinary(avatarLocalPath);
  let coverImage;
  if (coverImageLocalPath) {
    coverImage = await uploadCloudinary(coverImageLocalPath);
  }

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

const loginUser = asyncHandler(async (req, res) => {
  // data from req body
  // username or email
  // find the user
  // password check
  // access & refresh token
  // send them in cookie

  const { userName, email, password } = req.body;

  if ([userName, email].some((fields) => fields?.trim == ""))
    throw new ApiError(400, "username or email field is required.");

  if (!password) throw new ApiError(400, "Passsword is required.");

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  });

  if (!user) throw new ApiError(404, "User does not exist");

  const validPassword = await user.isPasswordCorrect(password);

  if (!validPassword) throw new ApiError(401, "Invalid credentials.");

  const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.refreshToken;

  userObject.accessToken = accessToken;

  const options = {
    httponly: true,
    secure: true,
  };
  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: userObject,
          accessToken,
          refreshToken,
        },
        "User Logged in succcessfully."
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.User._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .staus(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User Logged out."));
});

export { registerUser, loginUser, logoutUser };
