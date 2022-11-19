const db = require('../config/connection')
const collection = require('../config/collections')
var objectId = require('mongodb').ObjectId

module.exports = {
    //here add to wish List 
    addToWishList: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            let userWishlist = await db.get().collection(collection.WISHLIST_COLLECTION).findOne({ user: objectId(userId) }) // check is user true or false is false user first adding to wish list
            if (userWishlist) {
                db.get().collection(collection.WISHLIST_COLLECTION)
                    .updateOne(
                        { user: objectId(userId) }, { $addToSet: { products: objectId(productId) } }
                    ).then(() => {
                        resolve()
                    }) //if user have a wish list update  or we add 
            } else {
                db.get().collection(collection.WISHLIST_COLLECTION).insertOne(
                    { user: objectId(userId), products: [objectId(productId)] }).then(() => {
                        resolve()
                    })
            }
        })
    },
    getWishList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let wishlistProducts = await db.get().collection(collection.WISHLIST_COLLECTION)
                .aggregate([
                    {
                        $match: { user: objectId(userId) }
                    },
                    {
                        $unwind: "$products"
                    },
                    {
                        $lookup: {
                            from: "product",
                            localField: "products",
                            foreignField: "_id",
                            as: "products"
                        }
                    },
                    {
                        $project: {
                            products: { $arrayElemAt: ['$products', 0] }
                        }
                    }
                ]).toArray()
            resolve(wishlistProducts)
        })
    },
    deleteWishList: (details) => {
        console.log(details);
        return new Promise((resolve, reject) => {
            db.get().collection(collection.WISHLIST_COLLECTION)
                .updateOne({ _id: objectId(details.wishlistId) },
                    { $pull: { products:  objectId(details.proId) }}).then((response) => {
                        
                        resolve({ removeProduct: true })
                    })
        })
    }
}













