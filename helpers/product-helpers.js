const db = require('../config/connection')
const { Collection } = require('mongodb')
const collections = require('../config/collections')
const { response } = require('express')

var objectId = require('mongodb').ObjectId

module.exports = {

    addProduct: (product) => {
        product.category = objectId(product.category)
        db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product)
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getAllProductsLookUP: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "categoryDetails"
                    }
                },
                {
                    $unwind: "$categoryDetails"
                }
            ]).toArray()
            resolve(products)
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: objectId(productId) }).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((product) => {
                resolve(product)
            })
        })
    },
    getCategoryProducts: (categoryId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({ category: objectId(categoryId) }).toArray()
            //let categoryTitle=await db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(category) })
            //console.log(categoryTitle);
            console.log(products);
            //response.categoryTitle=categoryTitle;
            response.products = products;
            resolve(products)
        })
    },
    getProductCategory: (productCategoryId) => {
        console.log(productCategoryId);
        return new Promise(async (resolve, reject) => {
            let categoryName = await db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(productCategoryId) })
            console.log(categoryName.category);
            resolve(categoryName)
        })
    },
    updateProduct: (productId, productDetails) => {
        
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(productId) }, {
                    $set: {
                        titleMain: productDetails.titleMain,
                        title: productDetails.title,
                        category: objectId(productDetails.category),
                        brand: productDetails.brand,
                        color: productDetails.color,
                        costPrice: parseInt(productDetails.costPrice),
                        MRP: parseInt(productDetails.MRP),
                        categoryDiscount: parseInt(productDetails.categoryDiscount),
                        productDiscount: parseInt(productDetails.productDiscount),
                        totalDiscount: parseInt(productDetails.totalDiscount),
                        offerPrice: parseInt(productDetails.offerPrice),
                        stock: parseInt(productDetails.stock),
                        productDescription: productDetails.productDescription,
                        image1: productDetails.image1,
                        image2: productDetails.image2,
                        image3: productDetails.image3,
                        image4: productDetails.image4
                    }
                }).then((response) => {
                    console.log(response);
                    resolve()
                })
        })
    },
    changeValues: (categoryId, categoryDiscount) => {
        categoryDiscount = parseInt(categoryDiscount)
        // here change product db with effect of new category discount change
        return new Promise(async (resolve, reject) => {
            //step 1 for change the categoryDiscount in the DB
            let step1 = await db.get().collection(collections.PRODUCT_COLLECTION)
                .updateMany(
                    { category: objectId(categoryId) },
                    { $set: { categoryDiscount: categoryDiscount } }
                )
            // step 2 for update total field of the totalDiscount in db
            let step2 = await db.get().collection(collections.PRODUCT_COLLECTION)
                .updateMany(
                    { category: objectId(categoryId) },
                    [{ $set: { totalDiscount: { $add: ['$categoryDiscount', '$productDiscount'] } } }]
                )
            // step 3 for update offerPrice field of the totalDiscount in db with the latest change
            let step3 = await db.get().collection(collections.PRODUCT_COLLECTION)
                .updateMany(
                    { category: objectId(categoryId) },
                    [{ $set: { offerPrice: { $subtract: ['$MRP', { $multiply: ['$MRP', { $divide: ['$totalDiscount', 100] }] }] } } }]
                )
            resolve()
        })
    },
    fetchImage1: (proID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proID) }, { projection: { image1: true } })
            resolve(detail.image1)
        })
    },
    fetchImage2: (proID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proID) }, { projection: { image2: true } })
            resolve(detail.image2)
        })
    },
    fetchImage3: (proID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proID) }, { projection: { image3: true } })
            resolve(detail.image3)
        })
    },
    fetchImage4: (proID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proID) }, { projection: { image4: true } })
            resolve(detail.image4)
        })
    },
    fetchImage: (categoryID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryID) }, { projection: { image: true } })
            resolve(detail.image)
        })
    }


}



