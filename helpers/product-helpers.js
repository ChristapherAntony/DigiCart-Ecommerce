const db = require('../config/connection')
const { Collection } = require('mongodb')
const collections = require('../config/collections')
const { response } = require('express')

var objectId = require('mongodb').ObjectId

module.exports = {

    addProduct: (product) => {
        product.category = objectId(product.category)
        db.get().collection(collections.PRODUCT_COLLECTION).insertOne(product)
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find().toArray()
            resolve(products)
        })
    },
    getAllProductsLookUP: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).aggregate([
                {
                    $lookup: {
                        from: "category",
                        localField: "category",
                        foreignField: "_id",
                        as: "categoryDetails"
                    }
                },
                {
                    $unwind: "$categoryDetails"
                }
            ]).toArray()
            resolve(products)
        })
    },
    deleteProduct: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).deleteOne({ _id: objectId(productId) }).then((response) => {
                console.log(response);
                resolve(response)
            })
        })
    },
    getProductDetails: (productId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(productId) }).then((product) => {
                resolve(product)
            })
        })
    },
    getCategoryProducts: (categoryId) => {
        console.log(categoryId);
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({ category: objectId(categoryId) }).toArray()
            response.products = products;
            resolve(products)
        })
    },
    getCategoryProductsHome: (categoryId) => {
        console.log(categoryId);
        return new Promise(async (resolve, reject) => {
            let mobileCategory = await db.get().collection(collections.PRODUCT_COLLECTION).find({ category: objectId('6358e6ae421c3c872a21c472') }).toArray()
            let laptopCategory = await db.get().collection(collections.PRODUCT_COLLECTION).find({ category: objectId('6358e6d8421c3c872a21c473') }).toArray()
            let audioCategory = await db.get().collection(collections.PRODUCT_COLLECTION).find({ category: objectId('637cb20726a4b12a66625c8f') }).toArray()
            let watchCategory = await db.get().collection(collections.PRODUCT_COLLECTION).find({ category: objectId('6358e72f421c3c872a21c474') }).toArray()
            let televisionCategory = await db.get().collection(collections.PRODUCT_COLLECTION).find({ category: objectId('6358e7a5421c3c872a21c476') }).toArray()
            let categoryProducts = {
                mobileCategory: mobileCategory,
                laptopCategory: laptopCategory,
                audioCategory: audioCategory,
                watchCategory: watchCategory,
                televisionCategory: televisionCategory,
              }
            resolve(categoryProducts)
        })
    },
    getTopDiscounted: () => {
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({ totalDiscount: { $gte: 15 } }).toArray()
            response.products = products;
            resolve(products)
        })
    },
    getProductCategory: (productCategoryId) => {
        console.log(productCategoryId);
        return new Promise(async (resolve, reject) => {
            let categoryName = await db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(productCategoryId) })
            console.log(categoryName.category);
            resolve(categoryName)
        })
    },
    updateProduct: (productId, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.PRODUCT_COLLECTION)
                .updateOne({ _id: objectId(productId) }, {
                    $set: {
                        titleMain: productDetails.titleMain,
                        title: productDetails.title,
                        category: objectId(productDetails.category),
                        brand: productDetails.brand,
                        color: productDetails.color,
                        costPrice: parseInt(productDetails.costPrice),
                        MRP: parseInt(productDetails.MRP),
                        categoryDiscount: parseInt(productDetails.categoryDiscount),
                        productDiscount: parseInt(productDetails.productDiscount),
                        totalDiscount: parseInt(productDetails.totalDiscount),
                        offerPrice: parseInt(productDetails.offerPrice),
                        stock: parseInt(productDetails.stock),
                        productDescription: productDetails.productDescription,
                        image1: productDetails.image1,
                        image2: productDetails.image2,
                        image3: productDetails.image3,
                        image4: productDetails.image4
                    }
                }).then((response) => {
                    console.log(response);
                    resolve()
                })
        })
    },
    changeValues: (categoryId, categoryDiscount) => {
        categoryDiscount = parseInt(categoryDiscount)
        // here change product db with effect of new category discount change
        return new Promise(async (resolve, reject) => {
            //step 1 for change the categoryDiscount in the DB
            let step1 = await db.get().collection(collections.PRODUCT_COLLECTION)
                .updateMany(
                    { category: objectId(categoryId) },
                    { $set: { categoryDiscount: categoryDiscount } }
                )
            // step 2 for update total field of the totalDiscount in db
            let step2 = await db.get().collection(collections.PRODUCT_COLLECTION)
                .updateMany(
                    { category: objectId(categoryId) },
                    [{ $set: { totalDiscount: { $add: ['$categoryDiscount', '$productDiscount'] } } }]
                )
            // step 3 for update offerPrice field of the totalDiscount in db with the latest change
            let step3 = await db.get().collection(collections.PRODUCT_COLLECTION)
                .updateMany(
                    { category: objectId(categoryId) },
                    [{ $set: { offerPrice: { $subtract: ['$MRP', { $multiply: ['$MRP', { $divide: ['$totalDiscount', 100] }] }] } } }]
                )
            resolve()
        })
    },
    fetchImage1: (proID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proID) }, { projection: { image1: true } })
            resolve(detail.image1)
        })
    },
    fetchImage2: (proID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proID) }, { projection: { image2: true } })
            resolve(detail.image2)
        })
    },
    fetchImage3: (proID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proID) }, { projection: { image3: true } })
            resolve(detail.image3)
        })
    },
    fetchImage4: (proID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.PRODUCT_COLLECTION).findOne({ _id: objectId(proID) }, { projection: { image4: true } })
            resolve(detail.image4)
        })
    },
    fetchImage: (categoryID) => {
        return new Promise(async (resolve, reject) => {
            let detail = await db.get().collection(collections.CATEGORY_COLLECTION).findOne({ _id: objectId(categoryID) }, { projection: { image: true } })
            resolve(detail.image)
        })
    },
    addBanner: (details) => {
        return new Promise(async (resolve, reject) => {
            details.position = "Top_Main"
            details.dateAdded = new Date
            db.get().collection(collections.BANNER_COLLECTION).insertOne(details).then(() => {
                resolve()
            })

        })
    },
    getBannerTop_main: () => {
        return new Promise(async (resolve, reject) => {
            let response = await db.get().collection(collections.BANNER_COLLECTION).find({ position: 'Top_Main' }).toArray()
            resolve(response)
        })
    }
    ,
    getBannerDetails: (bannerId) => {
        return new Promise(async (resolve, reject) => {
            let response = await db.get().collection(collections.BANNER_COLLECTION).findOne({ _id: objectId(bannerId) })
            console.log(response);
            resolve(response)
        })
    },
    fetchBannerImg: (bannerId, BannerName) => {
        return new Promise(async (resolve, reject) => {
            let response = await db.get().collection(collections.BANNER_COLLECTION).findOne({ _id: objectId(bannerId) })
            if (BannerName === "largeImg") {
                resolve(response.largeImg)
            } else if (BannerName === "smallImg") {
                resolve(response.smallImg)
            }
        })
    },
    updateBanner: (bannerId, bannerDetails) => {
        console.log("indide the update banner", bannerId);
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).updateOne({ _id: objectId(bannerId) }, {
                $set: {
                    bannerTitle: bannerDetails.bannerTitle,
                    bannerDescription: bannerDetails.bannerDescription,
                    largeImg: bannerDetails.largeImg,
                    smallImg: bannerDetails.smallImg,
                    dateAdded: new Date()
                }
            }).then((response) => {
                resolve()
            })
        })
    },
    deleteTopBanner: (bannerId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collections.BANNER_COLLECTION).deleteOne({ _id: objectId(bannerId) }).then((response) => {
                resolve({ response: true })
            })
        })
    },
    getProductsBySearch: (searchData) => {
        console.log(searchData, "LLLLLLLLLLLLLLLLLLLLLL");
        return new Promise(async (resolve, reject) => {
            let length = searchData.length;
            let products = []
            if (length == 0 || searchData === " ") {
                resolve(products)
            } else {
                var re = new RegExp(searchData, "i");
                console.log(re, "reeeeeeeeee");
                products = await db.get().collection(collections.PRODUCT_COLLECTION).find({ title: re }).toArray()
                // let arr=[]
                // products.forEach((products,index)=>{
                //     arr.push(products.title)
                // })
                console.log(products);
                resolve(products)
            }




        })
    },
    filterPrice: (range) => {
        
        min = parseInt(range.range1)
        max = parseInt(range.range2)
        return new Promise(async (resolve, reject) => {
            let products = await db.get().collection(collections.PRODUCT_COLLECTION).find({ offerPrice: { $gte: min, $lte: max } }).toArray()
            console.log(products);
            resolve(products)
        })
    }


}



