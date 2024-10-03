import  mongoose , {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
    {
        videoFile:{
            type:String,
            required:true
        },
        thumbnail:{
            type:String,
            required:true
        },
        title:{
            type:String,
            required:true
        },
        description:{
            type:String,
            required:true
        },
        resolution:{
            type:String,
            default:"1080p",
            required:true
        },
        // resolutionPaths:{
        //     "144p":{
        //         type:String,
        //         default:null
        //     },
        //     "240p":{
        //         type:String,
        //         default:null
        //     },
        //     "360p":{
        //         type:String,
        //         default:null
        //     },
        //     "480p":{
        //         type:String,
        //         default:null
        //     },
        //     "720p":{
        //         type:String,
        //         default:null
        //     },
        //     "1080p":{
        //         type:String,
        //         default:null
        //     }
        // },
        duration:{
            type:Number,
            required:true
        },
        views:{
            type:Number,
            default:0
        },
        isPublished:{
            type:Boolean,
            default:true
        },
        owner:{
            type:Schema.Types.ObjectId,
            ref:"User"
        },
    },
    {
        timestamps:true
    }
)

videoSchema.plugin(mongooseAggregatePaginate);

export const Video = mongoose.model("Video",videoSchema);