import {Router} from "express";
import { 
    publishAVideo,
    getAllVideos,
    getVideoById
 } from "../controllers/video.controller.js";

 import {upload} from "../middlewares/multer.middleware.js";
 import { verifyJWT } from "../middlewares/auth.middleware.js";
import { get } from "mongoose";

 const router = Router();

 
 router.route("/publish").post(verifyJWT,upload.fields([
     {
         name:"videoFile",
         maxCount:1
        },
        {
            name:"thumbnail",
            maxCount:1
        }
    ]),publishAVideo);

 router.route("/all-videos").get(getAllVideos);

 router.route("/watch/:video_id").get(getVideoById);

 export default router;

//  getVideo,
//     getVideoById,
//     getVideosByChannel,
//     getVideosByCategory,
//     getVideosBySearch,
//     getTrendingVideos,
//     getRelatedVideos,
//     getLikedVideos,
//     getWatchLaterVideos,
//     getHistoryVideos,
//     getPlaylistVideos,
//     addVideo,
//     updateVideo,
//     deleteVideo,
//     likeVideo,
//     dislikeVideo,
//     watchLater,
//     removeFromWatchLater,
//     addToHistory,
//     addToPlaylist,
//     removeFromPlaylist

