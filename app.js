if(process.env.NODE_ENV != "production"){
    require('dotenv').config();
}

const express=require("express");
const app=express();
const mongoose=require('mongoose');
const path=require("path");
const methodOverride=require("method-override");
const ejsMate=require("ejs-mate");
const ExpressError=require ("./utils/expressError.js");
const session=require("express-session");
const MongoStore = require('connect-mongo');
const flash = require("connect-flash");
const passport=require("passport");
const Localstrategy = require("passport-local");
const user=require("./models/user.js");

const listingRouter=require("./routes/listing.js");
const reviewRouter=require("./routes/review.js");
const userRouter=require("./routes/user.js");

const dburl =process.env.ATLASDB_URL;

main()
    .then(()=>{
        console.log("connected to db");
    })
    .catch(err =>{
        console.log(err);
    });

async function main(){
    await mongoose.connect(dburl);
}

app.set("view engine","ejs");
app.set("views",path.join(__dirname,"views"));
app.use(express.urlencoded({extended:true}));
app.use(methodOverride("_method"));
app.engine("ejs",ejsMate);
app.use(express.static(path.join(__dirname,"/public")));

const store= MongoStore.create({
    mongoUrl:dburl,
    crypto:{
        secret:process.env.SECRET,
    },
    touchAfter:24*3600,
});

store.on("error", ()=>{
    console.log("ERROR in MONGO SESSION STORE")
});

const sessionOptions={
    store,
    secret:process.env.SECRET,
    resave:true,
    saveUninitialized:true,
    cookie:{
        expires:Date.now() + 72460601000,
        maxAge:72460601000,
        httpOnly:true,
    },
};

// app.get("/",(req,res)=>{
//     res.send("Hi, i am root");
// });


app.use(session(sessionOptions));
app.use(flash());

 app.use(passport.initialize());
 app.use(passport.session());
 passport.use(new Localstrategy(user.authenticate()));

passport.serializeUser(user.serializeUser());
 passport.deserializeUser(user.deserializeUser());


app.use((req,res,next)=>{
    res.locals.success=req.flash("success");
    res.locals.error=req.flash("error");
    res.locals.currUser = req.user;
    //console.log(res.locals.success);
    next();
});

// app.get("/demouser",async(req,res)=>{
//     let fakeUser = new user({
//         email:"student@gmail.com",
//         username: "delta-student",
//     });

//    let registeredUser =  await user.register(fakeUser,"helloworld");
//    res.send(registeredUser);
// });

app.use("/listings",listingRouter);
app.use("/listings/:id/reviews",reviewRouter);
app.use("/",userRouter);

 app.all("*",(req,res,next)=>{
             next(new ExpressError(404,"page not found"));
});

app.use((err,req,res,next)=>{
    let{statusCode=500,message="something went wrong"}=err; 
     console.log(err);
     res.render("error.ejs",{message});
    //res.status(statusCode).send(message);
});

app.listen(8080,()=>{
    console.log("server is listening to port 8080");
});