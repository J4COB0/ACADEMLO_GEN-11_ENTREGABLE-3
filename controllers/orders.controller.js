// Models
const { Cart } = require('../models/cart.model');
const { Order } = require('../models/order.model');
const { Product } = require('../models/product.model');
const { ProductInCart } = require('../models/productInCart.model');

// Utils
const { catchAsync } = require('../utils/catchAsync');
const { AppError } = require('../utils/appError');

const addProductToCart = catchAsync(async (req, res, next) => {
    const { productId, quantity } = req.body;
    const { sessionUser } = req;

    // Getting the product
    const product = await Product.findOne({
        where: { status: 'active', id: productId },
    });

    // Checking if product exist
    if (!product) {
        return next(new AppError('Product does not found, invalid ID', 404));
    }

    // Cheking if quantity if less that quantity available 
    if (quantity > product.quantity) {
        return next(
            new AppError('The quantity is bigger that available product', 400)
        );
    }

    // Searching for a cart
    let cart = await Cart.findOne({ where: { userId: sessionUser.id } });

    // Creatting a cart ff does not exist
    if (!cart) {
        cart = await Cart.create({ userId: sessionUser.id });
    }

    // Change to active if status cart is removed 
    if (cart.status === 'removed') {
        await cart.update({ status: 'active' });
    }

    // Searching the product in the cart
    let productInCart = await ProductInCart.findOne({
        where: { productId, cartId: cart.id },
    });

    // Creatting a new productInCart
    if (!productInCart) {
        productInCart = await ProductInCart.create({
            cartId: cart.id,
            productId,
            quantity,
        });
    // If por
    } else if (productInCart.status === 'removed') {
        productInCart.update({ status: 'active', quantity });
    } else if (productInCart.status === 'active') {
        return next(
            new AppError(
                'Product already exist in your cart, you cannot add it again',
                405
            )
        );
    }

    res.status(200).json({ status: 'success', data: productInCart });
});

const updateProductInCart = catchAsync(async (req, res, next) => {
    const { productId, newQty } = req.body;
    const { sessionUser } = req;

    // Getting the product
    const product = await Product.findOne({
        where: { status: 'active', id: productId },
    });

    if (!product) {
        return next(new AppError('Product does not found, invalid ID', 404));
    }

    // Checking if quantity is available
    if (newQty > product.quantity) {
        return next(
            new AppError('The quantity is bigger that available product', 400)
        );
    }

    // Searching a cart
    const cart = await Cart.findOne({
        where: { userId: sessionUser.id, status: 'active' },
    });

    if (!cart) {
        return next(new AppError('Cart does not exist', 400));
    }

    // Searching products in cart
    let productInCart = await ProductInCart.findOne({
        where: { productId, cartId: cart.id },
    });

    if (!productInCart) {
        return next(new AppError('Product does not exist in your cart', 400));
    }

    // If quantity to update if 0 change the state to removed else the status will be active
    if (newQty === 0) {
        await productInCart.update({ status: 'removed', quantity: newQty });
    } else {
        await productInCart.update({ status: 'active', quantity: newQty });
    }

    res.status(200).json({ status: 'success', data: productInCart });
});

const purchaseCart = catchAsync(async (req, res, next) => {
    const { sessionUser } = req;

    // Searching a cart by userid
    const cart = await Cart.findOne({
        where: { status: 'active', userId: sessionUser.id },
    });

    if (!cart) {
        return next(new AppError('You dont have any cart', 400));
    }

    // Getting all products in cart available
    const productsInCart = await ProductInCart.findAll({
        where: { status: 'active', cartId: cart.id },
    });

    if (productsInCart.length === 0) {
        return next(new AppError('No products in the cart', 400));
    }

    const totalPromises = productsInCart.map(async productinCart => {
        const product = await Product.findOne({
            where: { status: 'active', id: productinCart.productId },
        });

        // Getting the new quantity for this product
        const newQty = product.quantity - productinCart.quantity;

        // Updating the newquantity for this product
        await product.update({ quantity: newQty });

        // Getting the total price for this product
        const totalPrice = product.price * productinCart.quantity;

        // Purchase product in cart
        productinCart.update({ status: 'purchased' });

        return totalPrice;
    });

    // Update cart to purchased
    await cart.update({ status: 'purchased' });

    const totalResolved = await Promise.all(totalPromises);

    // Getting the total
    totalPrice = 0;
    for (let i = 0; i < totalResolved.length; i++) {
        totalPrice = totalPrice + totalResolved[i];
    }

    // Creating an order
    const newOrder = Order.create({
        userId: sessionUser.id,
        cartId: cart.id,
        totalPrice,
    });

    // Return the rult
    res.status(200).json({ status: 'success', data: newOrder });
});

const removeProductFromCart = catchAsync(async (req, res, next) => {
    const { productId } = req.params;
    const { sessionUser } = req;

    const product = await Product.findOne({
        where: { status: 'active', id: productId },
    });

    if (!product) {
        return next(new AppError('Product does not found, invalid ID', 404));
    }

    const cart = await Cart.findOne({
        where: { userId: sessionUser.id, status: 'active' },
    });

    if (!cart) {
        return next(new AppError('Cart does not exist', 400));
    }

    let productInCart = await ProductInCart.findOne({
        where: { productId, cartId: cart.id },
    });

    if (!productInCart) {
        return next(new AppError('Product does not exist in your cart', 400));
    }

    if (productInCart.status === 'removed') {
        return next(new AppError('The product has been deleted before', 400));
    }

    await productInCart.update({ status: 'removed', quantity: 0 });

    res.status(200).json({ status: 'success' });
});

module.exports = {
    addProductToCart,
    updateProductInCart,
    purchaseCart,
    removeProductFromCart,
};
