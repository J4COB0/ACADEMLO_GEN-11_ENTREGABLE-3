const { catchAsync } = require('../utils/catchAsync');

const productExist = catchAsync(async (req, res, next) => {
    const { id } = req.params;

    const product = await Product.findOne({
        where: { status: 'active', id },
    });

    if (!product) {
        return next(new AppError('Product does not found, invalid ID', 404));
    }

    req.product = product;
    next();
});

const protectProductOwner = catchAsync(async (req, res, next) => {
    const { product, sessionUser } = req;

    if (product.userId !== sessionUser.id) {
        return next(
            new AppError(
                'You are not the owner of this review, you can not update this file',
                401
            )
        );
    }

    next();
});

module.exports = { productExist, protectProductOwner };
