
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
                        $sort: { orderDate: -1 }
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
    getRecentOrderHistory: () => {
        return new Promise(async (resolve, reject) => {
            //db.get().collection(collection.ORDER_COLLECTION).deleteMany({ 'cartDetails.status': "Pending" }) // no need to store pending orders
            let orderHistory = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $sort: { orderDate: -1 }
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
                    },
                    {
                        $limit: 5
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
                            couponApplied: 1,
                            netAmountPaid: 1,
                            status: 1,
                            userDetails: 1,

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
                        $set: { 'cartDetails.$.status': changes.status }
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
                            actualPrice: '$cartDetails.product.costPrice',

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

    },
    getSalesReportByDate: (DateRange) => {
        return new Promise(async (resolve, reject) => {
            const salesReport = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            orderDate: { $gte: new Date(DateRange.fromDate), $lte: new Date(DateRange.toDate) }

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
                            actualPrice: '$cartDetails.product.costPrice',

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

    },
    topSelling: () => {
        return new Promise(async (resolve, reject) => {
            const top5 = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
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
                            image1: '$cartDetails.product.image1',
                            quantity: '$cartDetails.quantity',
                            salesTotal: '$cartDetails.productTotal',
                            item: "$cartDetails.product.title",
                            actualPrice: '$cartDetails.product.costPrice',
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
                    },
                    {
                        $lookup: {
                            from: 'product',
                            localField: '_id',
                            foreignField: 'title',
                            as: 'product'
                        }
                    },
                    {
                        $unwind: '$product'

                    },
                    {
                        $project: {
                            _id: 1,
                            SalesQty: 1,
                            Revenue: 1,
                            profit: 1,
                            image1: '$product.image1'

                        }
                    },
                    {
                        $sort: { SalesQty: -1 }
                    },
                    {
                        $limit: 5
                    }

                ]).toArray()
            resolve(top5)
        })
    },
    getMonthlyGraph: () => {
        return new Promise(async (resolve, reject) => {
            let monthlyGraph = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    { $group: { _id: { 'month': { $month: '$orderDate' }, 'year': { $year: '$orderDate' } }, totalAmount: { $sum: '$totalAmount' }, couponApplied: { $sum: '$couponApplied' }, netAmountPaid: { $sum: '$netAmountPaid' } } },
                    { $project: { _id: 0, year: '$_id.year', month: '$_id.month', totalAmount: 1, couponApplied: 1, netAmountPaid: 1 } },
                    { $sort: { year: -1, month: -1 } },
                    { $limit: 12 }
                ]).toArray()

            //-----------converting month number to month name----------------//
            monthlyGraph.forEach(element => {
                function toMonthName(month) {
                    const date = new Date();
                    date.setMonth(month - 1);
                    return date.toLocaleString('en-US', {
                        month: 'long',
                    });
                }
                element.month = toMonthName(element.month)
            });
            //-----------end converting month number to month name----------------//






            resolve(monthlyGraph)
        })
    },
    monthlyR_P_S: () => {
        return new Promise(async (resolve, reject) => {
            let monthlyGraph = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $project: {
                            _id: 0,
                            orderDate: 1,
                            cartDetails: 1
                        }
                    },
                    {
                        $unwind: '$cartDetails'
                    },
                    {
                        $project: {
                            orderDate: 1,
                            quantity: '$cartDetails.quantity',
                            salesTotal: '$cartDetails.productTotal',
                            item: "$cartDetails.product.title",
                            actualPrice: '$cartDetails.product.costPrice',

                            profit: { $subtract: ["$salesTotal", { $multiply: ['$quantity', '$actualPrice'] }] }
                        }
                    },
                    {
                        $addFields: {
                            profit: { $subtract: ["$salesTotal", { $multiply: ['$quantity', '$actualPrice'] }] }
                        }
                    },
                    { $group: { _id: { 'month': { $month: '$orderDate' }, 'year': { $year: '$orderDate' } }, Revenue: { $sum: '$salesTotal' }, profit: { $sum: '$profit' }, sales: { $sum: '$quantity' } } },
                    { $project: { _id: 0, year: '$_id.year', month: '$_id.month', Revenue: 1, profit: 1, sales: 1 } },
                    { $sort: { year: -1, month: -1 } },
                    { $limit: 12 }
                ]).toArray()

            //-----------converting month number to month name----------------//
            monthlyGraph.forEach(element => {
                function toMonthName(month) {
                    const date = new Date();
                    date.setMonth(month - 1);
                    return date.toLocaleString('en-US', {
                        month: 'long',
                    });
                }
                element.month = toMonthName(element.month)
            });
            //-----------end converting month number to month name----------------//






            resolve(monthlyGraph)
        })
    },
    addNewCoupon: (CouponDetails) => {
        CouponDetails.couponDiscount = parseInt(CouponDetails.couponDiscount)
        CouponDetails.maxAmount = parseInt(CouponDetails.maxAmount)
        CouponDetails.minSpend = parseInt(CouponDetails.minSpend)
        CouponDetails.expiryDate = new Date(CouponDetails.expiryDate)
        return new Promise(async (resolve, reject) => {
            let coupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponCode: CouponDetails.couponCode })
            if (coupon) {
                resolve({ status: false })
            } else {
                let add = await db.get().collection(collection.COUPON_COLLECTION).insertOne(CouponDetails)
                resolve({ status: true })
            }


        })
    },
    updateCoupon: (CouponDetails) => {
        console.log("inside the helper");
        console.log(CouponDetails);

        return new Promise(async (resolve, reject) => {
            let update = await db.get().collection(collection.COUPON_COLLECTION)
                .updateOne(
                    { _id: objectId(CouponDetails.id) },
                    {
                        $set: {
                            couponCode: CouponDetails.couponCode,
                            couponDescription: CouponDetails.couponDescription,
                            couponDiscount: parseInt(CouponDetails.couponDiscount),
                            maxAmount: parseInt(CouponDetails.maxAmount),
                            minSpend: parseInt(CouponDetails.minSpend),
                            expiryDate: new Date(CouponDetails.expiryDate)
                        }
                    }
                )
            resolve({ status: true })

        })
    },
    deleteCoupon: (couponId) => {
        console.log("insoide the helper", couponId.offerId);
        return new Promise(async (resolve, reject) => {
            let deleteCoupon = await db.get().collection(collection.COUPON_COLLECTION).deleteOne({ _id: objectId(couponId.offerId) })
            resolve()
        })

    },
    getActiveCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let activeCoupons = await db.get().collection(collection.COUPON_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            expiryDate: { $gte: new Date() }

                        }
                    },
                    {
                        $project:
                        {

                            expiryDate: { $dateToString: { format: "%d-%m-%Y ", date: "$expiryDate" } },
                            couponCode: 1,
                            maxAmount: 1,
                            minSpend: 1,
                            couponDescription: 1,
                            couponDiscount: 1

                        }
                    }
                ]).toArray()
            resolve(activeCoupons)
        })
    },
    getExpiredCoupons: () => {
        return new Promise(async (resolve, reject) => {
            let activeCoupons = await db.get().collection(collection.COUPON_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            expiryDate: { $lt: new Date() }

                        }
                    },
                    {
                        $project:
                        {

                            expiryDate: { $dateToString: { format: "%Y-%m-%d ", date: "$expiryDate" } },
                            couponCode: 1,
                            maxAmount: 1,
                            minSpend: 1,
                            couponDescription: 1,
                            couponDiscount: 1

                        }
                    }
                ]).toArray()
            resolve(activeCoupons)
        })
    },
    getCouponDiscount: (couponCode) => {
        return new Promise(async (resolve, reject) => {
            let checkCoupon = await db.get().collection(collection.COUPON_COLLECTION).findOne({ couponCode: couponCode })
            if (checkCoupon === null) {
                checkCoupon = {}
                checkCoupon.err = "Invalid Coupon Code"
                checkCoupon.status = false
                resolve(checkCoupon)
            } else {
                let checkDate = await db.get().collection(collection.COUPON_COLLECTION)
                    .findOne({ _id: checkCoupon._id, expiryDate: { $gte: new Date() } })
                    
                if (checkDate === null) {
                    checkDate = {}
                    checkDate.err = "Coupon Expired"
                    checkDate.status = false
                    resolve(checkDate)
                } else {
                    response = {}
                    response.status = true
                    response.coupon = checkDate
                    resolve(response)
                }

            }

        })
    }
}