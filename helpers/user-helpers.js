const db = require('../config/connection')
const collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectId
const Razorpay = require('razorpay');
const { uid } = require('uid')
var instance = new Razorpay({
    key_id: 'rzp_test_IsLNHEQ2MGIHsd',
    key_secret: 'NesRoFC2sgBMN8toPYVxtWUa',
});

const paypal = require('paypal-rest-sdk');
paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': 'ASAocgRIGuweasCF3uKZWPyapBhyFM7ulfBYknuDfGVp2knZIHyY24Bazj88u9g2hCmP5BWVAc0b33uX',
    'client_secret': 'EO-LQBODL7aJNl4krjvmClOiPrv8CwH-OAuPjPJp6MiaQsZieE1VXEbpxxRjsgQk7nem8_TAJeTvlBB7'
});


module.exports = {
    doSignUP: (userData) => {
        return new Promise(async (resolve, reject) => {
            userData.referralId = uid()
            userData.walletBalance = 0

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ $or: [{ UserEmail: userData.UserEmail }, { MobileNo: userData.MobileNo }] })
            if (user) resolve({ status: false })
            else {
                userData.Password = await bcrypt.hash(userData.Password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(async (data) => {
                    if (data.acknowledged) {
                        let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: data.insertedId })
                        response.user = user;
                        response.status = true;
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }


                })
            }
        })
    },
    applyReferral: (referralId, userID) => {
        return new Promise(async (resolve, reject) => {
            let existingUser = await db.get().collection(collection.USER_COLLECTION).findOne({ referralId: referralId })// check if any user have the referral id
            if (existingUser) {
                console.log("######################user matched");
                let newUser = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userID) })
                const transactionNewUser = {
                    date: new Date(),
                    title:"Referral Code",
                    transaction: "Rs.500 credited through referral code",
                    amount: 500,
                    referredBy: existingUser.UserName
                }
                const transactionReferredUser = {
                    date: new Date(),
                    title:"Referral Code",
                    transaction: "Rs.1000 credited by using your referral code",
                    amount: 1000,
                    usedBy: newUser.UserName
                }
                if (referralId == existingUser.referralId) {
                    let updateNewUser = await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userID) }, {
                        $inc: { walletBalance: 500 },
                        $push: {
                            walletTransaction: transactionNewUser
                        }
                    })
                    let updateExistingUser = await db.get().collection(collection.USER_COLLECTION).updateOne({ referralId: referralId }, {
                        $inc: { walletBalance: 1000 },
                        $push: {
                            walletTransaction: transactionReferredUser
                        }
                    })
                    resolve({ response: true })
                }
            }else{
                console.log("###################### not matched");
                resolve({ response: false })
            }
        })

    },
    addNewAddress: (address, userId) => {
        return new Promise((resolve, reject) => {
            address.addressId = new Date().valueOf() // added new field as with date value for editing address
            db.get().collection(collection.USER_COLLECTION).updateOne(
                { _id: objectId(userId) },
                { $push: { Address: address } }
            )
            resolve()
        })
    },
    getAllAddress: (userId) => {
        return new Promise(async (resolve, reject) => {
            const allAddress = await db.get().collection(collection.USER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: objectId(userId) }
                    },
                    {
                        $unwind: '$Address'
                    },
                    {
                        $project: {
                            _id: 0,
                            Address: '$Address'

                        }
                    }
                ]).toArray()
            resolve(allAddress)
        })
    },
    getOneAddress: (userId, position) => {
        position = parseInt(position)
        return new Promise(async (resolve, reject) => {
            const address = await db.get().collection(collection.USER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            _id: objectId(userId)
                        }
                    },
                    {
                        "$project": { "matched": { "$arrayElemAt": ['$Address', position] } }
                    }
                ]).toArray()
            resolve(address[0])
        })
    },
    getOneAddressById: (userId, address) => {
        console.log(userId, address);
        let addressId = parseInt(address)
        console.log(typeof (addressId));

        return new Promise(async (resolve, reject) => {
            const address = await db.get().collection(collection.USER_COLLECTION)
                .aggregate([
                    {
                        $match: {
                            _id: objectId(userId)
                        }
                    },
                    {
                        $unwind: '$Address'
                    },
                    {
                        $match: { 'Address.addressId': addressId }
                    },
                    {
                        $project: {
                            Address: 1
                        }
                    }
                ]).toArray()
            resolve(address[0])
        })
    },

    updateAddress: (newAddress, userId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)       //parseInt is for form data in the from of string
                .updateOne({ _id: objectId(userId), 'Address.addressId': parseInt(newAddress.addressId) },
                    {
                        $set: {
                            'Address.$.Name': newAddress.Name,
                            'Address.$.HouseNo': newAddress.HouseNo,
                            'Address.$.Street': newAddress.Street,
                            'Address.$.TownCity': newAddress.TownCity,
                            'Address.$.State': newAddress.State,
                            'Address.$.Country': newAddress.Country,
                            'Address.$.PostCode': newAddress.PostCode,
                            'Address.$.Mobile': newAddress.Mobile,
                            'Address.$.addressId': parseInt(newAddress.addressId)
                        }
                    })
            resolve()
        })
    },
    deleteAddress: (userId, addressId) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)       //parseInt is for form data in the from of string
                .updateOne({ _id: objectId(userId) }, { $pull: { Address: { addressId: parseInt(addressId) } } })
            resolve()
        })
    },
    verifyMobile: (mobileNo) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ MobileNo: mobileNo })
            if (user) {
                if (user.block) resolve({ active: false })
                resolve({ status: true })
            }
            else {
                resolve({ status: false })
            }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false;
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ $or: [{ UserEmail: userData.userID }, { MobileNo: userData.userID }] })
            if (user) {
                if (user.block) resolve({ active: false })
                bcrypt.compare(userData.Password, user.Password).then((status) => {    // if user true the check pw with bcrypt
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response)  // this response include user data and statues
                    } else {
                        resolve({ status: false }) // this response include only false status
                    }
                })   // compare userData pw with db pw
            } else {
                resolve({ status: false })
            }
        })
    },
    otpLogin: (mobileNumber) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ MobileNo: mobileNumber })
            resolve(user)
        })

    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser: (userID) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userID) }, { $set: { block: true } })
        })

    },
    unBlockUser: (userID) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectId(userID) }, { $set: { block: false } })
        })

    },
    adminLogin: (adminID) => {
        return new Promise(async (resolve, reject) => {
            let response = {}
            let user = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ UserName: adminID.UserName })
            if (user) {
                bcrypt.compare(adminID.Password, user.Password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response)
                    } else {
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },
    getHeaderDetails: (userId) => {

        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) })
            let CartProducts = await db.get().collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: objectId(userId) }

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

            let cart = null
            ///////////////////////////////////////////
            cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            let Total = 0
            if (CartProducts.length > 0) {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }  //get cart of th user

                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
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
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$product.offerPrice'] } }
                        }
                    }
                ]).toArray()
                Total = total[0].total
            }
            ///////////////////////////////
            const headerDetails = {}
            headerDetails.user = user.UserName
            headerDetails.cartProducts = CartProducts
            headerDetails.total = Total
            resolve(headerDetails)
        })
    },
    getUserDetails: (userId) => {
        return new Promise(async (resolve, reject) => {
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }, { Password: 0 })
            user.Password = null
            resolve(user)
        })

    },
    updateAndFetchProfile: (userDetails) => {
        let userId = userDetails.userId
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION)
                .updateOne({ _id: objectId(userId) }, {
                    $set: {
                        UserName: userDetails.UserName,
                        UserEmail: userDetails.UserEmail,
                        MobileNo: userDetails.MobileNo
                    }
                })
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectId(userId) }, { Password: 0 })
            user.Password = null
            resolve(user)
        })

    },

    //here we add to cart 
    addToCart: (productId, userId) => {
        let proObj = {
            item: objectId(productId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == productId)
                if (proExist != -1) {  // if product exists
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId), 'products.item': objectId(productId) },
                            {
                                $inc: { 'products.$.quantity': 1 }   // $ in between because of incrementing in an array
                            }
                        ).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectId(userId) },
                            {
                                $push: { products: proObj }
                            }).then((response) => {
                                resolve()
                            })

                }


            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId) => {

        return new Promise(async (resolve, reject) => {   // bellow - get the product id from the cart of the user and get details of the product in a single querry
            let total = await db.get().collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: objectId(userId) }

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
            resolve(total)

        })
    },
    getCartProductsWithOffer: (userId, total, couponApplied) => {
        couponApplied = parseInt(couponApplied)
        console.log("tottal cart amoutn", total);
        console.log("couponApplied", couponApplied);
        let cartTotal = parseInt(total)
        return new Promise(async (resolve, reject) => {   // bellow - get the product id from the cart of the user and get details of the product in a single querry
            let total = await db.get().collection(collection.CART_COLLECTION)
                .aggregate([
                    {
                        $match: { user: objectId(userId) }

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
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: 1, productTotal: 1, applicableCouponDiscount: { $round: [{ $multiply: [{ $divide: ['$productTotal', cartTotal] }, couponApplied] }] }
                        }
                    },
                    {
                        $project: {
                            item: 1, quantity: 1, product: 1, productTotal: 1, applicableCouponDiscount: 1, productNetTotal: { $subtract: ["$productTotal", "$applicableCouponDiscount"] }
                        }
                    }


                ]).toArray()
            resolve(total)

        })
    },
    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })

    },

    changeProductQuantity: (details) => {
        details.count = parseInt(details.count)
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart) },
                        {
                            $pull: { products: { item: objectId(details.product) } }
                        }).then((response) => {
                            resolve({ removeProduct: true })
                        })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectId(details.cart), 'products.item': objectId(details.product) },
                        {
                            $inc: { 'products.$.quantity': details.count }
                        }).then((response) => {
                            resolve({ status: true })
                        })
            }


        })
    },
    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {   // bellow - get the product id from the cart of the user and get details of the product in a single querry
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (cart.products.length > 0) {
                let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                    {
                        $match: { user: objectId(userId) }  //get cart of th user
                    },
                    {
                        $unwind: '$products'
                    },
                    {
                        $project: {
                            item: '$products.item',
                            quantity: '$products.quantity'
                        }
                    },
                    {
                        $lookup: {
                            from: collection.PRODUCT_COLLECTION,
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
                        $group: {
                            _id: null,
                            total: { $sum: { $multiply: ['$quantity', '$product.offerPrice'] } }
                        }
                    }
                ]).toArray()
                if (total) {
                    resolve(total[0].total)
                } else {
                    resolve()
                }
            }
            resolve()
        })
    },
    getCartProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            resolve(cart.products)
        })

    },
    placeOrder: (order, products, cartDetails, total, couponApplied) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).deleteMany({ 'cartDetails.status': "Pending" })
            let status = order.payment_method === 'COD' ? 'Placed' : 'Pending';
            cartDetails.forEach(cartDetails => {
                cartDetails.status = status
            })
            let orderObj = {
                orderDate: new Date(),
                deliveryDetails: {
                    Name: order.Name,
                    HouseNo: order.HouseNo,
                    Street: order.Street,
                    TownCity: order.TownCity,
                    State: order.State,
                    Country: order.Country,
                    PostCode: order.PostCode,
                    Mobile: order.Mobile,
                    message: order.message
                },
                userId: objectId(order.userId),
                payment_method: order.payment_method,
                products: products,
                cartDetails: cartDetails,
                totalAmount: total,
                couponApplied: couponApplied,
                netAmountPaid: (total - couponApplied)
            }
            console.log(orderObj);
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                //db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve(response.insertedId)
            })


        })
    },
    deletePendingOrder: (orderId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).deleteOne({ _id: objectId(orderId) })
            resolve()
        })
    },
    removeProduct: (details) => {  // we need cart id and product id to delete
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectId(details.cart) },
                    {
                        $pull: { products: { item: objectId(details.product) } }
                    }).then((response) => {
                        resolve({ removeProduct: true })
                    })
        })
    },
    clearCart: (userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })
            resolve()
        })
    },
    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([{ $match: { userId: objectId(userId) } },
                {
                    $sort: { orderDate: -1 }
                },
                {
                    $project: {
                        _id: 1,
                        orderDate: { $dateToString: { format: "%d-%m-%Y", date: "$orderDate" } },
                        deliveryDetails: 1,
                        userId: 1,
                        payment_method: 1,
                        products: 1,
                        totalAmount: 1,
                        status: 1
                    }
                }]).toArray()

            resolve(orders)
        })
    },
    orderProductDetails: (orderId) => {    /// old method changed to static price order history 

        return new Promise(async (resolve, reject) => {   // bellow - get the product id from the cart of the user and get details of the product in a single querry
            let products = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: objectId(orderId) }  //get cart of th user

                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
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
            resolve(products)

        })


    },
    getOrderDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderDetails = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([{ $match: { _id: objectId(orderId) } },
                {
                    $project: {
                        orderDate: { $dateToString: { format: "%d-%m-%Y ", date: "$orderDate" } },
                        deliveryDetails: 1,
                        payment_method: 1,
                        totalAmount: 1,
                        status: 1,
                        netAmountPaid: 1,
                        couponApplied: 1

                    }
                }]).toArray()

            resolve(orderDetails[0])
        })
    },
    oldProductDetails: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collection.ORDER_COLLECTION)
                .aggregate([
                    {
                        $match: { _id: objectId(orderId) }

                    },
                    {
                        $project: { cartDetails: 1, _id: 0 }
                    },
                    {
                        $unwind: '$cartDetails'
                    }
                ]).toArray()
            resolve(products)
        })
    },
    generateRazorpay: (orderID, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: '' + orderID  //to get receipt from razorpay we concatenate string to get it as a string
            };
            instance.orders.create(options, function (err, order) {
                resolve(order)
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'NesRoFC2sgBMN8toPYVxtWUa');

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex') //convert to 
            if (hmac == details['payment[razorpay_signature]']) {

                resolve()
            } else {
                ;
                reject()
            }
        })
    },
    changePaymentStatus: ((orderID, userId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(userId) })
            db.get().collection(collection.ORDER_COLLECTION)
                .update(
                    { _id: objectId(orderID) },
                    {
                        $set: { 'cartDetails.$[].status': 'Placed' }
                    })
                .then(() => {
                    console.log("inside resolve 2222222222222222@@@@@@@@@@@@");
                    resolve()
                })
        })
    }),
    createPay: (payment) => {
        return new Promise((resolve, reject) => {
            paypal.payment.create(payment, function (err, payment) {
                if (err) {
                    reject(err);
                } else {
                    resolve(payment);
                }
            });
        });
    },
    cancelOrder: ((Id) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).update(
                { _id: objectId(Id.orderId), 'cartDetails.item': objectId(Id.proId) },
                {
                    $set: { 'cartDetails.$.status': 'Cancelled' }
                })
                .then(() => {
                    resolve()
                })
        })
    })

}




