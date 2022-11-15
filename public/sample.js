db.user.find({ _id: ObjectId("6357871e14b2be8794b5dfe8") }, { Address: 1, _id: 0 })

db.user.find({ _id: ObjectId("6357871e14b2be8794b5dfe8") }, { Address: 1, _id: 0 })

db.user.aggregate([
    {
        $match: { _id: ObjectId("6357871e14b2be8794b5dfe8") }
    },
    {
        $unwind: '$Address'
    },
    {
        $project: {
            _id: 0,
            Address: '$Address'

        }
    },
    { "$project": { "matched": { "$arrayElemAt": ["$Address", 1] } } }
])


db.user.aggregate([
    {
        $match: {
            _id: ObjectId("6357871e14b2be8794b5dfe8")
        }
    },
    {
        "$project": { "matched": { "$arrayElemAt": ['$Address', 0] } }
    }
])


db.user.update(
    { _id: ObjectId("6357871e14b2be8794b5dfe8") },
    {
        $set: {
            'Address.1.content': {
                Name: 'Christapher Antony',
                HouseNo: '+919446655316',
                Street: 'KARTHIKAPURAM (PO)',
                TownCity: 'Kannur',
                State: 'Kerala',
                Country: 'India',
                PostCode: '670571',
                Mobile: ''
            }
        }
    }
)




db.user.updateOne({ _id: ObjectId("6357871e14b2be8794b5dfe8"), Address: 1 },
    {
        $set: {
            'Address': {
                Name: 'hello11111',
                HouseNo: '+919446655316',
                Street: 'KARTHIKAPURAM (PO)',
                TownCity: 'Kannur',
                State: 'Kerala',
                Country: 'India',
                PostCode: '670571',
                Mobile: ''
            }
        }
    })

db.user.updateOne({ _id: ObjectId("6357871e14b2be8794b5dfe8"), Address: 1 },
    {
        $set: {
            Address: {
                Name: 'hello',
                HouseNo: '+919446655316',
                Street: 'KARTHIKAPURAM (PO)',
                TownCity: 'Kannur',
                State: 'Kerala',
                Country: 'India',
                PostCode: '670571',
                Mobile: ''
            }
        }
    })


db.user.aggregate([
    {
        $match: {
            _id: ObjectId("636ca815ae1373bc4f89de1b")
        }
    },
    {
        $unwind: '$Address'
    },
    {
        $match: { 'Address.addressId': 1668065353143 }
    },
    {
        $project: {
            Address: 1
        }
    }
])


db.user.findOne({ 'Address.addressId': 1668065353143 })



//////////////

[
    {
        _id: ObjectId("636bdf702a2622285946646f"),
        user: ObjectId("6357871e14b2be8794b5dfe8"),
        products: [{ item: ObjectId("635ed6c1d1b23fcb3045f0bd"), quantity: 1 }]
    },
    {
        _id: ObjectId("636d3b4796e402d724c10468"),
        user: ObjectId("636ca815ae1373bc4f89de1b"),
        products: [
            { item: ObjectId("635ed6c1d1b23fcb3045f0bd"), quantity: 2 },
            { item: ObjectId("635f7e3e99d47d24e675b159"), quantity: 1 }
        ]
    }
]



db.cart.aggregate([
    {
        $match: { user: ObjectId("636ca815ae1373bc4f89de1b") }

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



db.order.aggregate([
    { $match: { _id: ObjectId("636d3b4796e402d724c10468") } }
])



db.order.aggregate([
    {
        $match: { _id: ObjectId("636d41977890e9772de97429") }

    },
    {
        $project: { cartDetails: 1, _id: 0 }
    },
    {
        $unwind: '$cartDetails'
    }
])


db.order.aggregate([
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

])






db.order.aggregate([
    {
        $match: {
            $and: [
                { payment_method: 'COD' },
                { $expr: { $gt: ["$orderDate", { $dateSubtract: { startDate: "$$NOW", unit: "day", amount: 14 } }] } }
            ]

        }
    },
    {
        $group: {
            _id: '$payment_method',
            count: { $sum: 1 }
        }
    }
])








let ONLINE = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
    {
        $match: {
            $and: [
                { paymentMethod: 'ONLINE' },
                { $expr: { $gt: ["$date", { $dateSubtract: { startDate: "$$NOW", unit: "day", amount: 7 } }] } }
            ]

        }
    },

    {
        $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 }
        }
    }

])

let PAYPAL = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
    {
        $match: {
            $and: [
                { paymentMethod: 'PAYPAL' },
                { $expr: { $gt: ["$date", { $dateSubtract: { startDate: "$$NOW", unit: "day", amount: 7 } }] } }
            ]

        }
    },

    {
        $group: {
            _id: '$paymentMethod',
            count: { $sum: 1 }
        }
    }

])
console.log('COD', COD, 'ONLINE', ONLINE, 'PAYPAL', PAYPAL);







db.order.aggregate([
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
])


db.order.aggregate([
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
        $unwind:'$product'

    },
    {
        $project:{
            _id: 1,
            SalesQty: 1,
            Revenue: 1,
            profit: 1,
            image1:'$product.image1'

        }
    },
    {
        $sort:{SalesQty:-1}
    },
    {
        $limit : 5 
    }

])

ObjectId("635a9ff46da75fcc6558646d")--//pro
ObjectId("636fb01d9f50adc401f32050")--//order

db.order.updateOne(
    { _id: ObjectId("636fb01d9f50adc401f32050")},
    {
        $set: { 'cartDetails.$[].status': 'Done' }
    })

db.order.find({'cartDetails.$[].status':"Pending"})



db.order.aggregate([
    {
        $match: {
            orderDate:{$gte:ISODate("2020-11-02"),$lte:ISODate("2023-11-13")}
        }
    }
])

db.order.find({orderDate:{$gte:ISODate("2020-11-02"),$lte:ISODate("2023-11-13")}}).count()