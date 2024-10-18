import {Router} from "express";
import { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateUserDetails,
    updateAvatar,
    updateCoverImage,
    getUserChannelProfile,
    getWatchHistory,
    getChannelById
 } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";


const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name:"avatar",
            maxCount:1
        },
        {
            name:"coverImage",
            maxCount:1
        }
    ]),
    registerUser
    );

router.route("/login").post(upload.none(),loginUser);

//secured route

router.route("/logout").post(verifyJWT,upload.none(), logoutUser);
router.route("/refresh-token").post(upload.none(),refreshAccessToken);
router.route("/change-password").post(verifyJWT,upload.none(), changeCurrentPassword );
router.route("/current-user").get(verifyJWT, getCurrentUser );
router.route("/update-details").patch(verifyJWT,upload.none(),updateUserDetails );
router.route("/c/:id").get(getChannelById);
router.route("/update-details/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar );
router.route("/update-details/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateCoverImage );

router.route("/channel/:username").get(verifyJWT,getUserChannelProfile);

router.route("/history").get(verifyJWT,getWatchHistory);

export default router;

