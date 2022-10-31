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
                // console.log(userData);
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
            let user = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ UserName: adminID.UserName }) // check email
            if (user) {
                bcrypt.compare(adminID.Password, user.Password).then((status) => {    // if user true the check pw with bcrypt
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
    //here we add to cart 
    addToCart: (productId, userId) => {
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectId(userId) })
            if (userCart) {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ user: objectId(userId) },
                        {
                            $push: { products: objectId(productId) }
                        }).then((response) => {
                            resolve()
                        })

            } else {
                let cartObj = {
                    user: objectId(userId),
                    products: [objectId(productId)]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    console.log(response);
                    resolve()
                })
            }
        })
    },
     getCartProducts: (userId) => {
        console.log("inside the helprer");
        console.log(userId);
        return new Promise(async (resolve, reject) => {   // bellow - get the product id from the cart of the user and get details of the product in a single querry
            console.log("inside the get cart p return");
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectId(userId) }  //get cart of th user

                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
                        let: { productList: '$products' },
                        pipeline: [
                            {
                                $match: {
                                    $expr: {
                                        $in: ['$_id', '$$productList']
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
                }

            ]).toArray()
            resolve(cartItems[0].cartItems)

        })
    }


}