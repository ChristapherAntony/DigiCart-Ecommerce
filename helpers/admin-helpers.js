
const db = require('../config/connection')
const collection = require('../config/collections')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId



module.exports = {
    getOrderHistory:()=>{
        return new Promise(async(resolve,reject)=>{
            let orderHistory=await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orderHistory)

        })
    }
}