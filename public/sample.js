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




db.user.updateOne({ _id: ObjectId("6357871e14b2be8794b5dfe8"),Address:1 },
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

    db.user.updateOne({ _id: ObjectId("6357871e14b2be8794b5dfe8"),Address: 1  },
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
            $match:{'Address.addressId':1668065353143}
        },
        {
            $project:{
                Address:1
            }
        }
    ])


    db.user.findOne({'Address.addressId':1668065353143})