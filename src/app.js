import dotenv from "dotenv";
import express, { urlencoded } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

dotenv.config({
    path: "./env"
});

const app = express();
app.use(cors({
    origin:'http://localhost:8001',
    credentials:true,
}));
app.use(express.json({
    limit:"20kb"
}));
app.use(urlencoded({
    extended:true,
    limit:"20kb"
}));
app.use(express.static("public"));
app.use(cookieParser());

//import routes
import userRouter from "./routes/user.routes.js";
import videoRouter from "./routes/video.routes.js";

app.use("/api/v1/users",userRouter);
app.use('/api/v1/videos',videoRouter);



export default app;