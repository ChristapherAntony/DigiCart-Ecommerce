const { resolve } = require("promise");
require('dotenv').config()

var SID = process.env.TWILIO_SID;
var TOKEN = process.env.TWILIO_TOKEN;
const client = require("twilio")(SID, TOKEN);
var serviceID=process.env.TWILIO_serviceID

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
