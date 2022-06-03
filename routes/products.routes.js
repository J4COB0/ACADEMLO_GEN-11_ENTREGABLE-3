const express = require('express');

// Controllers
const {
    getAllProducts,
    getProductById,
    createProduct,
    updateProduct,
    deleteProduct,
    getAllCategories,
    createCategory,
    updateCategory,
} = require('../controllers/products.controller');

// Middlewares
const { protectToken } = require('../middlewares/users.middlewares');
const {
    createProductValidations,
    createCategoryValidations,
    checkValidations,
} = require('../middlewares/validations.middlewares');
const {
    productExist,
    protectProductOwner,
} = require('../middlewares/products.middlewares');

const router = express.Router();

router.get('/', getAllProducts);
router.get('/categories', getAllCategories);
router.get('/:id', getProductById);

router.use(protectToken);
router.post('/', createProductValidations, checkValidations, createProduct);
router.route('/:id').patch(updateProduct).delete(deleteProduct);
router.post('/categories', createCategoryValidations, checkValidations, createCategory);
router.patch('/categories/:id', updateCategory);

module.exports = { productsRouter: router };
