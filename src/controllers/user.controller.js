import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError }from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessTokenAndRefreshTokens = async(userId)=>{
    try {
        const user = await User.findById(userId);
        // console.log(user.refreshToken);
        const accessToken =   user.generateAccessToken();
        const refreshToken =  user.generateRefreshToken();

        user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave:false });

        // console.log(user.refreshToken);

        return {accessToken,refreshToken};
    } catch (error) {
        throw new ApiError(500,"Token generation failed");
    }
}

const registerUser = asyncHandler(async (req,res) => {
    const { username,email,fullname,password } = req.body;
    if(
        [username,email,fullname,password].some((field) => field?.trim()==="" || field===undefined)
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

const loginUser = asyncHandler(async (req,res)=>{
    const {email,username,password} = req.body;
    if(!email && !username){
        throw new ApiError(400,"Please provide email or username");
    }
    const user = await User.findOne({
        $or: [{email},{username}]
    })

    if(!user){
        throw new ApiError(404,"User Not Found");
    }

    const isPasswordValid = await user.isPasswordCorrect(password);

    if(!isPasswordValid){
        throw new ApiError(401,"Invalid Credentials");
    }

    const {accessToken,refreshToken} = await generateAccessTokenAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options={
        httpOnly:true,
        secure:true
    }

    return res
    .status(200)
    .cookie("accessToken",accessToken,options)
    .cookie("refreshToken",refreshToken,options)
    .json(
        new ApiResponse(
            200,
            {
                user:loggedInUser,refreshToken,accessToken,
            },
            "User is logged in successfully"
        )
    )


})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                refreshToken:"",
            }
        },
        {
            new:true,
        }
    )

    const options={
        httpOnly:true,
        secure:true
    }

    res
    .status(200)
    .clearCookie("accessToken",options)
    .clearCookie("refreshToken",options)
    .json(
        new ApiResponse(
            200,
            {
                
            },
            "User is logged out successfully"
        )
    );

})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if(!incomingRefreshToken){
        throw new ApiError(401,"Unauthorized request and token is not coming");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401,"Invalid refresh token");
        }
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401,"used or expired refresh token");
        }
    
        const options={
            httpOnly:true,
            secure:true
        }
    
        const {accessToken,newRefreshToken} = await generateAccessTokenAndRefreshTokens(user._id);
    
        return res
        .status(200)
        .cookie("accessToken",accessToken,options)
        .cookie("refreshToken",newRefreshToken,options)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken:newRefreshToken,
                },
                "Access token is refreshed successfully"
            )
        )
    } catch (error) {
        throw new ApiError(401,error?.message || "Invalid refresh token");
    }
})

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken
    };