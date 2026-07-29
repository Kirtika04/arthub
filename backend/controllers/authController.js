const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const signToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user.id);
    
    // Remove password from output
    user.password = undefined;

    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.register = catchAsync(async (req, res, next) => {
    const { name, email, password, role, phone, store_name } = req.body;

    // Validate Input
    if (!name || !email || !password || !role) {
        return next(new AppError('Please provide all required fields.', 400));
    }

    if (role === 'seller' && !store_name) {
        return next(new AppError('Store name is required for sellers.', 400));
    }

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
        return next(new AppError('Email is already in use.', 400));
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create User
    const userId = await User.create({
        name, email, password: hashedPassword, role, phone, store_name
    });

    const newUser = await User.findById(userId);
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // 1. Check if email and password exist
    if (!email || !password) {
        return next(new AppError('Please provide email and password!', 400));
    }

    // 2. Check if user exists && password is correct
    const user = await User.findByEmail(email);
    
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }

    if (!user.is_active) {
        return next(new AppError('Your account has been deactivated.', 401));
    }

    // 3. If everything ok, send token to client
    createSendToken(user, 200, res);
});

exports.getMe = catchAsync(async (req, res, next) => {
    res.status(200).json({
        status: 'success',
        data: {
            user: req.user
        }
    });
});

exports.protect = catchAsync(async (req, res, next) => {
    // 1) Getting token and check if it's there
    let token;
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }

    // 2) Verification token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3) Check if user still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(new AppError('The user belonging to this token does no longer exist.', 401));
    }

    // Check if account is active
    if (!currentUser.is_active) {
        return next(new AppError('Your account has been deactivated.', 401));
    }

    // GRANT ACCESS TO PROTECTED ROUTE
    req.user = currentUser;
    next();
});
