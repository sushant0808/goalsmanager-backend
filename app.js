
const express = require("express");
const mongoose = require("mongoose");
const cors = require('cors');
const cookieParser = require("cookie-parser");
require("dotenv").config();
const userRoute = require("./routes/UserRoute");
const app = express();
const bodyParser = require("body-parser");

app.use(cors({
    origin: ["http://localhost:3000"],
    credentials:true,
}))

app.use(cookieParser());

app.use(express.json())
app.use(express.urlencoded({extended:true}));

app.get("/home",(req,res) => {
    res.send('Executed...');
})

app.use("/",userRoute);

mongoose.connect(process.env.DB)
.then(() => {
    console.log("Database connected.....")
})
.catch((err) => {
    console.log(err);
})

app.listen(process.env.PORT || 8002,() => {
    console.log('Server running on port 8002');
})