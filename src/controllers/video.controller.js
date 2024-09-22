import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError }from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const publishAVideo = asyncHandler(async (req, res) => {
    const owner = User.findById(req.user._id);
    if(!owner){
        throw new ApiError(404,"User not found");
    }
    else{
        console.log("Owner found",owner);
    }
    const { title, description } = req.body
    // TODO: get video, upload to cloudinary, create video
    if(!title || !description){
        throw new ApiError(400,"Title and description are required");
    }

    if(!req.files || !req.files.videoFile || !req.files.thumbnail){
        throw new ApiError(400,"Video and thumbnail are required");
    }

    const videoFileLocalPath = await req.files.videoFile[0].path;
    const thumbnailLocalPath = await req.files.thumbnail[0].path;

    if(!videoFileLocalPath || !thumbnailLocalPath){
        throw new ApiError(500,"Internal Server Error");
    }

    const videoFile = await uploadOnCloudinary(videoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.create({
        videoFile : videoFile.url,
        thumbnail : thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner:owner._id
    })

    const createdVideo = await Video.findById(video._id);
    if(!createdVideo){
        throw new ApiError(500,"Internal Server Error");
    }

    return res.status(201).json(
        new ApiResponse(
            201,
            createdVideo,
            "Video created successfully"
        )
    )

})

const getAllVideos = asyncHandler(async (req, res) => {
    console.log("get all videos req hitting");
    const videos = await Video.find();
    if(!videos){
        throw new ApiError(404,"No videos found");
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            videos,
            "All videos fetched successfully"
        )
    )
})

export { 
    publishAVideo,
    getAllVideos
 };