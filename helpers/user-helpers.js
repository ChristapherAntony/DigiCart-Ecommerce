const db = require('../config/connection')
const collection = require('../config/collections')
var bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectId


module.exports = {
    doSignUP: (userData) => {
        return new Promise(async (resolve, reject) => {
            console.log(userData);

            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ $or: [{ UserEmail: userData.UserEmail }, { MobileNo: userData.MobileNo }] })
            if (user) resolve({ status: false })
            else {
                userData.Password = await bcrypt.hash(userData.Password, 10)
                db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                    resolve({ status: true })
                })
            }
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

                ])


                // .aggregate([
                //     {
                //         $match: { user: objectId(userId) }  //get cart of th user

                //     },
                //     {
                //         $unwind: '$products'
                //     },
                //     {
                //         $project: {
                //             item: '$products.item',
                //             quantity: '$products.quantity'
                //         }
                //     },
                //     {
                //         $lookup: {
                //             from: collection.PRODUCT_COLLECTION,
                //             localField: 'item',
                //             foreignField: '_id',
                //             as: 'product'
                //         }
                //     },
                //     {
                //         $project: {
                //             item: 1, quantity: 1, product: { $arrayElemAt: ['$product', 0] }
                //         }
                //     }
                // ])
                .toArray()
            console.log("get cart profuctd ////////////////******************//////////////////////");
            console.log(total);
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


            resolve(total[0].total)

        })

    },
    getCartProductsList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })

            resolve(cart.products)
        })

    },
    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            let status = order.payment_method === 'COD' ? 'Placed' : 'Pending'
            let orderObj = {
                date: new Date(),
                deliveryDetails: {
                    Name: order.Name,
                    HouseNo: order.HouseNo,
                    Street: order.Street,
                    TownCity: order.TownCity,
                    State: order.State,
                    Country: order.Country,
                    PostCode: order.PostCode,
                    Mobile: order.Mobile,
                    Email: order.Email,
                    message: order.message
                },
                userId: objectId(order.userId),
                payment_method: order.payment_method,
                products: products,
                totalAmount: total,
                status: status
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectId(order.userId) })
                resolve()
            })

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
                    $project: {
                        _id: 1,
                        date: { $dateToString: { format: "%d-%m-%Y  %H:%M", date: "$date" } },
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
    orderProductDetails: (orderId) => {

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
                        date: { $dateToString: { format: "%d-%m-%Y ", date: "$date" } },
                        deliveryDetails: 1,
                        payment_method: 1,
                        totalAmount: 1,
                        status: 1
                    }
                }]).toArray()

            resolve(orderDetails[0])
        })
    },
}


