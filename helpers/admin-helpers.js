
const db = require('../config/connection')
const collection = require('../config/collections')
var bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectId



module.exports = {
    getOrderHistory: () => {
        return new Promise(async (resolve, reject) => {
            //db.get().collection(collection.ORDER_COLLECTION).deleteMany({ 'cartDetails.status': "Pending" }) // no need to store pending orders
            let orderHistory = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $sort:{orderDate:-1}
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
    changeDeliveryStatus: (changes) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .update(
                    { _id: objectId(changes.orderId), 'cartDetails.item': objectId(changes.proId) },
                    {
                        $set: { 'cartDetails.$.status':changes.status }
                    })
                .then((response) => {
                    resolve()
                })
        })
    },
    getDashDetails: () => {
        return new Promise(async (resolve, reject) => {
            const CODCount = await db.get().collection(collection.ORDER_COLLECTION).find({ payment_method: "COD" }).count()
            const PayPalCount = await db.get().collection(collection.ORDER_COLLECTION).find({ payment_method: "PAYPAL" }).count()
            const OnlineCount = await db.get().collection(collection.ORDER_COLLECTION).find({ payment_method: "ONLINE" }).count()
            const TotalSales = await db.get().collection(collection.ORDER_COLLECTION).find().count()
            const TotalUsers = await db.get().collection(collection.USER_COLLECTION).find().count()
            const Revenue = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $group: {
                            _id: "",
                            "Total": { $sum: "$totalAmount" }
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            "TotalAmount": '$Total'
                        }
                    }
                ]).toArray()

            const Count = {}
            Count.CODCount = CODCount
            Count.OnlineCount = OnlineCount
            Count.PayPalCount = PayPalCount
            Count.TotalSales = TotalSales
            Count.TotalUsers = TotalUsers
            Count.TotalRevenue = Revenue[0].TotalAmount
            resolve(Count)
        })
    },
    getSalesReport: () => {
        return new Promise(async (resolve, reject) => {
            const salesReport = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            $nor: [{ status: "Pending" },]
                        }
                    },
                    {
                        $project: {
                            _id: 0,
                            cartDetails: 1
                        }
                    },
                    {
                        $unwind: '$cartDetails'
                    },
                    {
                        $project: {
                            quantity: '$cartDetails.quantity',
                            salesTotal: '$cartDetails.productTotal',
                            item: "$cartDetails.product.title",
                            actualPrice: '$cartDetails.product.actualPrice',

                            profit: { $subtract: ["$salesTotal", { $multiply: ['$quantity', '$actualPrice'] }] }
                        }
                    },
                    {
                        $addFields: {
                            profit: { $subtract: ["$salesTotal", { $multiply: ['$quantity', '$actualPrice'] }] }
                        }
                    },
                    {
                        $group: {
                            _id: '$item',
                            SalesQty: { $sum: '$quantity' },
                            Revenue: { $sum: '$salesTotal' },
                            profit: { $sum: '$profit' }
                        }
                    }
                ]).toArray()
            resolve(salesReport)

        })

    }
    // ,
    // topSelling: () => {
    //     return new Promise(async (resolve, reject) => {
    //         const salesReport = await db.get().collection(collection.ORDER_COLLECTION)
    //             .aggregate([
    //                 {
    //                     $match: {
    //                         $nor: [{ status: "Pending" },]
    //                     }
    //                 },
    //                 {
    //                     $project: {
    //                         _id: 0,
    //                         cartDetails: 1
    //                     }
    //                 }

    //             ])

    //         resolve()

    //     })


    // }
}