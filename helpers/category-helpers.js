const db = require('../config/connection')
const collection = require('../config/collections')
const { Collection } = require('mongodb')
const collections = require('../config/collections')

var objectId = require('mongodb').ObjectId

module.exports = {

    addCategory: (categoryDetails, callback) => {
        db.get().collection(collections.CATEGORY_COLLECTION).insertOne(categoryDetails).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllCategory: () => {
        return new Promise(async (resolve, reject) => {   //getting data should write in await 
            let categories = await db.get().collection(collections.CATEGORY_COLLECTION).find().toArray()  // toArray- convert into an array
            resolve(categories)
        })
    },
    deleteCategory: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).deleteOne({ _id: objectId(categoryId) }).then((response) => {
                resolve(response)
            })
        })
    },
    getCategoryDetails: (categoryId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryId) }).then((response) => {
                resolve(response)
            })

        })
    },
    updateCategory: (categoryId, categoryDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.CATEGORY_COLLECTION).updateOne({ _id: objectId(categoryId) }, {
                $set: {
                    category: categoryDetails.category,
                    Description: categoryDetails.Description
                }
            }).then((response) => {
                resolve()
                
            })

        })
    },
    updateProduct:(productId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(productId)},{
                $set:{
                    Brand:productDetails.Brand,
                    Description:productDetails.Description,
                    Price:productDetails.Price
                }
            }).then((response)=>{
                resolve()
            })
        })
    }









}
