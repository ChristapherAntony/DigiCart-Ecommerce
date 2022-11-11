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
    { $match: { _id:ObjectId("636d3b4796e402d724c10468" )} }
])



db.order.aggregate([
    {
        $match: { _id: ObjectId("636d41977890e9772de97429") }

    },
    {
        $project:{cartDetails:1,_id:0}
    },
    {
        $unwind: '$cartDetails'
    }
])