import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError }from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
// import { exec } from "child_process";

// const transcodeVideo = (inputPath, outputPath) => {
//     const ffmpegCommand = `ffmpeg -i ${inputPath} \
//     -vf scale=w=1920:h=1080 -c:v libx264 -crf 20 -preset fast -c:a aac -b:a 128k -hls_time 10 -hls_playlist_type vod -f hls ${outputPath}/1080p.m3u8 \
//     -vf scale=w=1280:h=720 -c:v libx264 -crf 20 -preset fast -c:a aac -b:a 128k -hls_time 10 -hls_playlist_type vod -f hls ${outputPath}/720p.m3u8 \
//     -vf scale=w=854:h=480 -c:v libx264 -crf 20 -preset fast -c:a aac -b:a 128k -hls_time 10 -hls_playlist_type vod -f hls ${outputPath}/480p.m3u8 \
//     -vf scale=w=640:h=360 -c:v libx264 -crf 20 -preset fast -c:a aac -b:a 128k -hls_time 10 -hls_playlist_type vod -f hls ${outputPath}/360p.m3u8`;

//     exec(ffmpegCommand, (err, stdout, stderr) => {
//         if (err) {
//             console.error('Error during transcoding:', err);
//             return;
//         }
//         console.log('Transcoding finished successfully');
//     });
// };


const publishAVideo = asyncHandler(async (req, res) => {
    console.log("getting the user req");
    const owner = await User.findById(req.user._id);
    if(!owner){
        throw new ApiError(404,"User not found");
    }
    const { title, description,resolution } = req.body
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
        resolution: resolution || '1080p',
        duration: videoFile.duration,
        owner:owner._id
    })

    const createdVideo = await Video.findById(video._id);
    if(!createdVideo){
        throw new ApiError(500,"Internal Server Error");
    }

    const videoId = await video._id;

    console.log("updation of owner details");

    //Adding the Owner's details to the video
    const updatedVideo = await Video.aggregate([
        {
            $match:{
                _id: videoId
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project:{
                "videoFile": 1,
                "thumbnail": 1,
                "title": 1,
                "description": 1,
                "resolution": 1,
                "duration": 1,
                "owner.fullname": 1,
                "owner.avatar": 1,
                "owner._id": 1
            }
        }
    ])

    if(!updatedVideo?.length){
        throw new ApiError(404,"Video does not exist");
    }

    console.log("Updated Video Onwer fullname : ",updatedVideo[0].owner.fullname);

    return res.status(201).json(
        new ApiResponse(
            201,
            updatedVideo[0],
            "Video created successfully and Owner details added"
        )
    )
})

const getAllVideos = asyncHandler(async (req, res) => {
    // console.log("get all videos req hitting");
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