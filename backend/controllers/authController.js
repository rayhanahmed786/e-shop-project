
const User = require('../models/user');
const ErrorHandler =require('../utils/errorHandler');
const catchAsyncErrors= require('../middlewares/catchAsyncError');
const sendEmail=require('../utils/sendEmail');
const sendToken = require('../utils/jwtToken');
const crypto = require('crypto');
const cloudinary = require('cloudinary');



// register a user  => api/v1/register


exports.registerUser = catchAsyncErrors( async (req, res, next) =>{

    const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: 'avatars',
        width: 150,
        crop: "scale"
        
    })

    const { name, email, password } = req.body;
    const user = await User.create({
        name,
        email,
        password,
        avatar: {
            public_id: result.public_id,
            url: result.secure_url
        }
    })

    sendToken(user, 200,res)

})


// Login user =>  /api/v1/login


exports.loginUser = catchAsyncErrors( async (req, res, next) => {
    const {email, password} = req.body;

    // Checks if email and password is entered by user
    if (!email || !password){
        return next(new ErrorHandler('please enter email and password', 400));
    }
    // finding user in database
    const user = await User.findOne({email}).select('+password');

    if (!user){
        return next(new ErrorHandler('Invalid email and password', 401) );
    }
    // Checks password is correct or not
    const isPasswordMatched = await user.comparePassword(password);
    if (!isPasswordMatched){
        return next(new ErrorHandler('Invalid Email or password',401));
    }
    sendToken (user, 200, res)
})


// Forgot Password  => /api/v1/password/forgot



exports.forgotPassword = catchAsyncErrors(async (req, res, next) =>{
    const user = await User.findOne({ email: req.body.email});

    if (!user){
        return next(new ErrorHandler('user not found with the email', 404));
    }
    //get reset token
    const resetToken = user.getResetPasswordToken();
    await user.save({ validateBeforeSave: false});

    // create resat password url
    const resetUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;

    const message = `Your password reset token is as follow:\n\n${resetUrl}\n\nIf you have not requested the email, then ignore it,`

    try {
        await sendEmail({
            email: user.email,
            subject: 'ShopIT password Recovery',
            message
        })

        res.status(200).json({
            success: true,
            message:`Email send to: ${user.email} `
        })
    }catch (error) {
        user.resetPasswordToken = undefined;
        user.restPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        return next(new ErrorHandler(error.message,500))
    }
})


// Resat Password  => /api/v1/password/reset/:token



exports.resetPassword  = catchAsyncErrors(async (req, res,next) => {
    //Hash url token

    const resetPasswordToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({
        resetPasswordToken,
        restPasswordExpire: { $gt: Date.now() }
    })
    if(!user) {
        return next(new ErrorHandler('Password resat token is invalid and expired', 400))
    }
    if (req.body.password !== req.body.confirmPassword){
        return next(new ErrorHandler('Password is not match', 400))
    }
    //set new password
    user.password = req.body.password;

    user.resetPasswordToken = undefined;
    user.restPasswordExpire = undefined;

    await user.save();
    sendToken(user , 200, res);


})

// Get currently login user  details => /api/v1/me


exports.getUserProfile = catchAsyncErrors(async (req, res, next) =>{
    const  user = await User.findById(req.user.id);

    res.status(200).json({
        success: true,
        user
    })
})

// Update / change password  => /api/v1/password

exports.updatePassword = catchAsyncErrors( async (req, res, next) => {
    const user = await User.findById(req.user.id).select('+password')

    // check previous user password

    const isMatched = await user.comparePassword(req.body.oldPassword)
    if (!isMatched){
        return next(new ErrorHandler('old password is incorrect',400) )
    }
    user.password = req.body.password;
    await user.save();

    sendToken(user, 200, res)
})


// update user profile  /api/v1/me/update
exports.updateProfile = catchAsyncErrors( async (req, res, ) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email
    }
    // Update avatar : TODO 

    if (req.body.avatar !== '') {
        const user = await User.findById(req.user.id)

        const image_id = user.avatar.public_id;
        const res = await cloudinary.v2.uploader.destroy(image_id);
        const result = await cloudinary.v2.uploader.upload(req.body.avatar, {
            folder: 'avatars',
            width: 150,
            crop: "scale"

        })
        newUserData.avatar = {
            public_id: result.public_id,
            url: result.secure_url
        }
    }

    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true,
        user

    })
})






// Logout user  => /api/v1/logout


exports.logout = catchAsyncErrors(async (req, res, next) => {
    res.cookie('token', null,{
        expires: new Date(Date.now()),
        httpOnly: true
    })
    res.status(200).json({
        success: true,
        message: 'Logged out'
    })
})


// Admin routs

// get all user => /api/v1/admin/user
exports.allUsers = catchAsyncErrors(async (req, res, next) => {
    const users = await User.find();

    res.status(200).json({
        success: true,
        users
    })
})



// update user profile  /api/v1/admin/user/:id

exports.updateUser = catchAsyncErrors( async (req, res, next ) => {
    const newUserData = {
        name: req.body.name,
        email: req.body.email,
        role: req.body.role


    }
    const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
        new: true,
        runValidators: true,
        useFindAndModify: false
    })

    res.status(200).json({
        success: true,
        user
    })
})



// Get user details  => /api/v1/admin/user/:id
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user){
        return next(new ErrorHandler('User does not found with id: ${req.params.id}'))
    }
    res.status(200).json({
        success: true,
        user
    })
} )

// delete user  => /api/v1/admin/user/:id
exports.deleteUser = catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user){
        return next(new ErrorHandler('User does not found with id: ${req.params.id}'))
    }
    //remove avatar from cloudinary
    const image_id = user.avatar.public_id;
    await cloudinary.v2.uploader.destroy(image_id);

    await user.remove();

    res.status(200).json({
        success: true
    })
} )




