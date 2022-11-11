
const db = require('../config/connection')
const collection = require('../config/collections')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId



module.exports = {
    getOrderHistory: () => {
        return new Promise(async (resolve, reject) => {
            let orderHistory = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $lookup: {
                            from: 'user',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            orderDate: { $dateToString: { format: "%d-%m-%Y", date: "$orderDate" } },
                            deliveryDetails: 1,
                            payment_method: 1,
                            totalAmount: 1,
                            status: 1,
                            deliveryDetails: 1,
                            userDetails: 1,
                            userDetails: { $arrayElemAt: ['$userDetails', 0] }
                        }
                    }
                ]).toArray()

            resolve(orderHistory)
        })
    },
    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderDetails = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: objectId(orderId) }
                    },
                    {
                        $lookup: {
                            from: 'user',
                            localField: 'userId',
                            foreignField: '_id',
                            as: 'userDetails'
                        }
                    },
                    {
                        $unwind: '$userDetails'
                    },
                    {
                        $project:
                        {
                            _id: 1,
                            date: { $dateToString: { format: "%d-%m-%Y ", date: "$date" } },
                            deliveryDetails: 1,
                            userId: 1,
                            payment_method: 1,
                            totalAmount: 1,
                            status: 1,
                            userDetails: 1
                        }
                    }
                ]).toArray()
            resolve(orderDetails[0])
        })
    },
    orderDetailsProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderDetailsProducts = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: objectId(orderId) }

                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            user: 1,
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: 'product',
                            localField: 'item',
                            foreignField: '_id',
                            as: 'product'
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: 1, productTotal: { $sum: { $multiply: ['$quantity', '$product.offerPrice'] } }
                        }
                    }

                ]).toArray()
                resolve(orderDetailsProducts)


        })
    },
    changeDeliveryStatus:(changes)=>{
        return new Promise ((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
            .updateOne({_id:objectId(changes.cartId)},{$set:{status:changes.status}}).then((response)=>{
                resolve()
            })
        })
    }
}