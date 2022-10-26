const db = require('../config/connection')
const collection = require('../config/collections')
const { Collection } = require('mongodb')
const collections = require('../config/collections')

var objectId=require('mongodb').ObjectId

module.exports={

    addProduct:(product,callback)=>{
        db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product).then((data)=>{
            callback(data.insertedId)
        })
    },
    getAllProducts: () => {  
        return new Promise(async (resolve, reject) => {   
            let products =await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray() 
            resolve(products)
        })
    },
    deleteProduct: (productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({_id:objectId(productId)}).then((response)=>{
                console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails:(productId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({_id:objectId(productId)}).then((product)=>{
                resolve(product)
            })
        })
    },
    updateProduct:(productId,productDetails)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collections.PRODUCT_COLLECTION)
            .updateOne({_id:objectId(productId)},{
                $set:{
                    title:productDetails.title,
                    category:productDetails.category,
                    brand:productDetails.brand,
                    color:productDetails.color,
                    RAM:productDetails.RAM,
                    ROM:productDetails.ROM,
                    os:productDetails.os,
                    actualPrice:productDetails.actualPrice,
                    offerPrice:productDetails.offerPrice,
                    productDescription:productDetails.productDescription
                }
            }).then((response)=>{
                console.log(response);
                resolve()
            })
        })
    }

}



