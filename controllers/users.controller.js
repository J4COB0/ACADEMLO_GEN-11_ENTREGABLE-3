const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Models
const { User } = require('../models/user.model');
const { Cart } = require('../models/cart.model');
const { Order } = require('../models/order.model');
const { Product } = require('../models/product.model');
const { ProductInCart } = require('../models/productInCart.model');

// Utils
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');
const { filterObject } = require('../utils/filterObject');

dotenv.config({ path: './config.env' });

const getAllUsers = catchAsync(async (req, res, next) => {
    const users = await User.findAll({
        attributes: { exclude: ['password'] },
    });

    res.status(200).json({
        users,
    });
});

const createUser = catchAsync(async (req, res, next) => {
    const { username, email, password, role } = req.body;

    const salt = await bcrypt.genSalt(12);
    const hashPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
        username,
        email,
        password: hashPassword,
        role,
    });

    // Remove password from response
    newUser.password = undefined;

    res.status(201).json({ newUser });
});

const getUserById = catchAsync(async (req, res, next) => {
    const { user } = req;

    res.status(200).json({
        user,
    });
});

const updateUser = catchAsync(async (req, res, next) => {
    const { user } = req;
    const data = filterObject(req.body, 'username', 'email');

    await user.update({ ...data });

    res.status(200).json({ status: 'success' });
});

const deleteUser = catchAsync(async (req, res, next) => {
    const { user } = req;

    await user.update({ status: 'deleted' });

    res.status(200).json({
        status: 'success',
    });
});

const login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    // Validate that user exists with given email
    const user = await User.findOne({
        where: { email, status: 'active' },
    });

    // Compare password with db
    if (!user || !(await bcrypt.compare(password, user.password))) {
        return next(new AppError('Invalid credentials', 400));
    }

    // Generate JWT
    const token = await jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRES_IN,
    });

    user.password = undefined;

    res.status(200).json({ token, user });
});

const checkToken = catchAsync(async (req, res, next) => {
    res.status(200).json({ user: req.sessionUser });
});

const getUserProducts = catchAsync(async (req, res, next) => {
    const { sessionUser } = req;

    const products = await Product.findAll({
        where: { status: 'active', userId: sessionUser.id },
    });

    if (!products) {
        return next(new AppError('Products are not find', 404));
    }

    res.status(200).json({ status: 'success', data: { products } });
});

const getUserOrders = catchAsync(async (req, res, next) => {
    const { sessionUser } = req;

    const orders = await Order.findAll({
        where: { status: 'active', userId: sessionUser.id },
        include: [
            {
                model: Cart,
                include: [
                    { model: ProductInCart, include: [{ model: Product }] },
                ],
            },
        ],
    });

    if (!orders) {
        return next(new AppError('Oders are not found', 404));
    }

    res.status(200).json({ status: 'success', data: orders });
});

const getUserOrderById = catchAsync(async (req, res, next) => {
    const { sessionUser } = req;

    const order = await Order.findOne({
        where: { status: 'active', userId: sessionUser.id, id },
        include: [
            {
                model: Cart,
                include: [
                    { model: ProductInCart, include: [{ model: Product }] },
                ],
            },
        ],
    });

    if (!order) {
        return next(new AppError('Order does not found, invalid ID', 404));
    }

    res.status(200).json({ status: 'success', data: order });
});

module.exports = {
    getAllUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser,
    login,
    checkToken,
    getUserProducts,
    getUserOrders,
    getUserOrderById,
};
