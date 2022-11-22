const db = require('../config/connection')
const collection = require('../config/collections')
const { Collection } = require('mongodb')
const collections = require('../config/collections')

var objectId = require('mongodb').ObjectId

module.exports = {

    addCategory: (categoryDetails) => {
        return new Promise(async(resolve,reject)=>{
            categoryDetails.categoryDiscount = parseInt(categoryDetails.categoryDiscount)
            let category = await db.get().collection(collections.CATEGORY_COLLECTION).findOne({ category: categoryDetails.category })
            if (category) {
                resolve({ status: false })
            } else {
                db.get().collection(collections.CATEGORY_COLLECTION).insertOne(categoryDetails)
                resolve({ status: true })
            }
        })  
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {   //getting data should write in await 
            let categories = await db.get().collection(collections.CATEGORY_COLLECTION).find().toArray()  // toArray- convert into an array
            resolve(categories)
        })
    },
    deleteCategory: (categoryId) => {
        return new Promise(async (resolve, reject) => {
            let categoryProducts = await db.get().collection(collections.PRODUCT_COLLECTION).find({ category: objectId(categoryId) }).toArray()
            let response = {}
            if (categoryProducts.length == 0) {
                db.get().collection(collections.CATEGORY_COLLECTION).deleteOne({ _id: objectId(categoryId) }).then((response) => {
                    { response.status=true }
                    resolve(response)
                })
            } else {
                
                response.status = false,
                response.length = categoryProducts.length
                resolve(response)
            }

        })
    },
    getCategoryDetails: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) }).then((response) => {
                resolve(response)
            })

        })
    },
    getCategoryDiscount: (categoryName) => {
        console.log(categoryName, "hello");
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).findOne({ category: categoryName }).then((response) => {
                resolve(response.categoryDiscount)
            })
        })
    },
    updateCategory: (categoryId, categoryDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoryId) }, {
                $set: {
                    category: categoryDetails.category,
                    Description: categoryDetails.Description,
                    image: categoryDetails.image,
                    categoryDiscount: parseInt(categoryDetails.categoryDiscount)
                }
            }).then((response) => {
                resolve()

            })

        })
    },
    updateProduct: (productId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(productId) }, {
                    $set: {
                        Brand: productDetails.Brand,
                        Description: productDetails.Description,
                        Price: productDetails.Price
                    }
                }).then((response) => {
                    resolve()
                })
        })
    }
}
