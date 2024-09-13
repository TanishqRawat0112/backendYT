import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError }from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
const registerUser = asyncHandler(async (req,res) => {
    const { username,email,fullname,password } = req.body;
    if(
        [username,email,fullname,password].some((field) => field?.trim()==="")
    ){
        throw new ApiError(400,"Please provide all required fields");
    }

    const existedUser = await User.findOne({
        $or: [{ email },{ username },{ fullname }]
    })

    if(existedUser){
        throw new ApiError(409,"User already exists");
    }

    const avatarLocalPath = await req.files?.avatar[0]?.path;
    // const coverImageLocalPath = await req.files?.coverImage[0]?.path;
    let coverImageLocalPath="";
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length>0){
        coverImageLocalPath = req.files.coverImage[0].path;
    }
    else{
        // throw new ApiError(410,"Cover Image not uploaded");
        console.log("Cover Image not uploaded");
    }

    if(!avatarLocalPath){
        throw new ApiError(410,"Avatar is required");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar){
        throw new ApiError(410,"Avatar is not uploaded");
    }

    const user = await User.create({
        username : username.toLowerCase(),
        email,
        fullname,
        password,
        avatar : avatar.url,
        coverImage  : coverImage?.url || "",
    })

    const createdUser = await User.findById(user._id).select("-password -refreshToken");
    if(!createdUser){
        throw new ApiError(500,"User is not registered");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdUser,
            "User is registered successfully"
        )
    )

})

export { registerUser };