const express=require("express");
const router=express.Router();
const Listing=require("../models/listing.js");
const wrapAsync=require ("../utils/wrapasync.js");
const {isLoggedIn,isOwner,validateListing}=require("../middleware.js");

const listingcontroller=require("../controllers/listing.js");
const multer=require("multer");
const {storage}=require("../cloudConfig.js");
const upload = multer ({storage});


router.route("/")
.get(wrapAsync(listingcontroller.index))
.post(isLoggedIn,upload.single('listing[image]'),wrapAsync(listingcontroller.createListing));

//New route
router.get("/new",isLoggedIn,listingcontroller.renderNewForm);
//
router.route("/:id")
.get(listingcontroller.showListing)
.put(isLoggedIn,isOwner,upload.single("listing[image]"),listingcontroller.updateListing
)
.delete(isLoggedIn,isOwner,listingcontroller.destroyListing);



//Edit route

router.get("/:id/edit", isLoggedIn ,isOwner, listingcontroller.renderEdit);


module.exports =router;