const mongoClient = require('mongodb').MongoClient
const state={
    db:null
}

module.exports.connect=(done)=>{
    const url ="mongodb+srv://christapher012:Chris012@cluster0.1sshytz.mongodb.net/?retryWrites=true&w=majority"
    const dbname="BroCamp-Project-1"

    mongoClient.connect(url,(err,data)=>{
        if(err) return done(err)
        state.db=data.db(dbname)
        done()
    })
}    
module.exports.get=function(){
    return state.db
}
///test
 
