// Models
const { Product } = require('../models/product.model');
const { Category } = require('../models/category.model');

// Utils
const { AppError } = require('../utils/appError');
const { catchAsync } = require('../utils/catchAsync');
const { filterObject } = require('../utils/filterObject');

const getAllProducts = catchAsync(async (req, res, next) => {
    const products = await Product.findAll({ where: { status: 'active' } });

    res.status(200).json({ status: 'success', data: products });
});

const getProductById = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findOne({ where: { status: 'active', id } });

    if (!product) {
        return next(new AppError('Product does not found, invalid ID', 404));
    }

    res.status(200).json({ status: 'success', data: product });
});

const createProduct = catchAsync(async (req, res, next) => {
    const { title, description, price, quantity, categoryId } = req.body;
    const { sessionUser } = req;

    const newProduct = await Product.create({
        title,
        description,
        price,
        quantity,
        categoryId,
        userId: sessionUser.id,
    });

    res.status(200).json({ status: 'active', data: newProduct });
});

const updateProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { sessionUser } = req;

    const data = filterObject(
        req.body,
        'title',
        'description',
        'price',
        'quantity'
    );

    const product = await Product.findOne({
        where: { status: 'active', id },
    });

    if (!product) {
        return next(new AppError('Product does not found, invalid ID', 404));
    }

    if (product.userId !== sessionUser.id) {
        return next(
            new AppError(
                'You are not the owner of this review, you can not update this file',
                401
            )
        );
    }

    await product.update({ ...data });

    res.status(200).json({ status: 'success' });
});

const deleteProduct = catchAsync(async (req, res, next) => {
    const { id } = req.params;
    const { sessionUser } = req;

    const product = await Product.findOne({
        where: { status: 'active', id },
    });

    if (!product) {
        return next(new AppError('Product does not found, invalid ID', 404));
    }

    if (product.userId !== sessionUser.id) {
        return next(
            new AppError(
                'You are not the owner of this review, you can not update this file',
                401
            )
        );
    }

    await product.update({ status: 'deleted' });

    res.status(200).json({ status: 'success' });
});

const getAllCategories = catchAsync(async (req, res, next) => {
    const categories = await Category.findAll({ where: { status: 'active' } });

    res.status(200).json({ status: 'success', data: categories });
});

const createCategory = catchAsync(async (req, res, next) => {
    const { name } = req.body;

    const newCategory = await Category.create({ name });

    res.status(201).json({ status: 'success', data: newCategory });
});

const updateCategory = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const data = filterObject(req.body, 'name');

    const category = await Category.findOne({ where: { status: 'active', id } });

    if (!category) {
        return next(new AppError('Category does not found, invalid ID', 404));
    }

    await category.update({ ...data });

    res.status(200).json({ status: 'success' });
});

module.exports = {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllCategories,
    createCategory,
    updateCategory,
};
