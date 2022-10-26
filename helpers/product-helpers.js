const db = require('../config/connection')
const collection = require('../config/collections')
const { Collection } = require('mongodb')
const collections = require('../config/collections')

var objectId=require('mongodb').ObjectId

module.exports={

    add:(categoryDetails,callback)=>{
        db.get().collection(collections.CATEGORY_COLLECTION).insertOne(categoryDetails).then((data)=>{
            callback(data.insertedId)
        })
    } 
}



