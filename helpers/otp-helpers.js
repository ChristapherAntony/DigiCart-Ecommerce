const { resolve } = require("promise");

// var SID = 'ACb4522cd51eb3121c4c53c610e9bee305';
// var TOKEN = 'a1a60434705ddbdfbb23167be91a34d4';
// const client = require("twilio")(SID, TOKEN);
// var serviceID="VA85eda85a1c289a46a184c7d2b911fd6f"
// var serviceID2="VAee134840b830a620a75b3695d42027ba"

///////////////////////////////////////////////////////
// var SID = 'ACf1ebd2cf2450f7894e53fd1c2102312d';
// var TOKEN = '2c5791d538451f8930d481f22a77f108';
// const client = require("twilio")(SID, TOKEN);
// var serviceID="VA918ca3e6955f568ef6ce662237432b01"

///////////////////////////////////////////////////////
var SID = 'ACffff65f5f3ab28aaa2a7831ff8652ad0';
var TOKEN = 'b9d659ec44c5faffadd75919c8b722f8';
const client = require("twilio")(SID, TOKEN);
var serviceID="VAef87ebf177d535fc635fea4588db8d97"
///////////////////////////////////////////////////////






var mobileNumber


module.exports = {

    sendOTP: (phoneNumber) => {
        mobileNumber=phoneNumber
        return new Promise(async(resolve,reject)=>{
            client.verify
            .services(serviceID) // Change service ID
            .verifications.create({
                to: `+${mobileNumber}`,
                channel:  "sms",
            })
            .then((data) => {
               resolve(data)
            });

        })

    },
    verifyOTP:(OTP)=>{
      console.log(OTP);
        return new Promise(async(resolve,reject)=>{
            client.verify
            .services(serviceID) 
            .verificationChecks.create({
              to: `+${mobileNumber}`,
              code: OTP,
            })
            .then((data) => {
              if (data.status === "approved") {
                resolve({status:true})
              } else {
                resolve({status:false})
              }
            });
        
        })
    }

}
