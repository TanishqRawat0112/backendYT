import mongoose, { isValidObjectId } from "mongoose"
import  {User}  from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // TODO: toggle subscription
    // check if channel exists
    // return error response if channel does not exist
    // check if user is already subscribed to channel
    // if yes, unsubscribe
    // if no, subscribe
    // return success response
    console.log("toggleSubscription");
    const { channelId } = req.params
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel Id is not valid");
    }
    try {
        if (isValidObjectId(channelId)) {
            const channel = await User.find({ _id: channelId })
            if (channel.length === 0) {
                throw new ApiError(404, "channel does not exists")
            }
        }
        else {
            throw new ApiError(400, "Invalid channel id")
        }
        const isSubscribed = await Subscription.find({
            subscriber: req.user._id,
            channel: channelId
        })
        if (isSubscribed.length === 0) {
            await Subscription.create({
                subscriber: req.user._id,
                channel: channelId
            })
        }
        else {
            await Subscription.deleteOne({
                subscriber: req.user._id,
                channel: channelId
            })
        }
        return res
            .status(200)
            .json(
                new ApiResponse(200, null, "Subscription toggled successfully")
            )
    } catch (error) {
        throw new ApiError(500, error?.message || "error while toggling subscription")
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
    // check if channel exists
    // return error response if channel does not exist
    // return subscriber list of the channel
    // return success response

    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel Id is not valid");
    }
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "subscriber",
                foreignField: "_id",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribers: {
                    $first: "$subscribers"
                }
            }
        },
        {
            $group: {
                _id: null,
                subscribers: { $push: "$subscribers" },
                totalSubscribers: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                subscribers: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                },
                subscribersCount: "$totalSubscribers",
            }
        }
    ])
    if (!subscribers) {
        throw new ApiError(404, "Subscribers not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "Subscribers fetched successfully"
            )
        );
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    // check if user exists
    // return error response if user does not exist
    // return channel list to which user has subscribed
    // return success response

    if (!subscriberId || !isValidObjectId(subscriberId)) {
        throw new ApiError(400, "User Id is not valid");
    }
    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels"
            }
        },
        {
            $addFields: {
                channels: {
                    $first: "$channels"
                }
            }
        },
        {
            $group: {
                _id: null,
                channels: { $push: "$channels" },
                totalChannels: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                channels: {
                    _id: 1,
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                },
                channelsCount: "$totalChannels",
            }
        }
    ])

    if (!subscribedChannels) {
        throw new ApiError(404, "Subscribed channels not found");
    }
    return res.status(200).json(
        new ApiResponse(
            200,
            subscribedChannels,
            "Subscribed channels fetched successfully"
        )
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}