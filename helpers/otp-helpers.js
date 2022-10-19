
require("dotenv").config();
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const serviceSid = process.env.TWILIO_SERVICE_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);


module.exports = {
    makeOtp : (phoneNumber) => {
        return new Promise((resolve, reject) => {
            client.verify.v2.services(serviceSid)
                .verifications
                .create({ to: `+91${phoneNumber}`, channel: 'sms',
                
             })
             
                .then((response) => {
                    console.log(response.status);
                    resolve(response)
                }) 
                .catch((err) => {
                    console.log("it is error" + err);
                    reject(err)
                })
        })
    },
    verifyOtp: (phoneNumber, otp) => {
        console.log(phoneNumber);
        console.log(otp);
        return new Promise((resolve, reject) => { 
            client.verify.v2.services(serviceSid)
                .verificationChecks
                .create({ to: `+91${phoneNumber}`, code: otp.otp })
                .then((verified) => {
                    console.log(verified);
                    resolve(verified);
                })
                .catch((err) => {
                    console.log("verification error" + err);
                    reject(err)
                })
        })
    }
}