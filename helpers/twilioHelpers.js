const dotenv = require("dotenv")
dotenv.config()
const client = require('twilio')(process.env.TWILIO_FST_ID, process.env.TWILIO_SND_ID)
const serviceSid = process.env.TWILIO_SERVICES_ID
module.exports = {

    doSms: (noData) => {
        let res = {}
        return new Promise(async (resolve, reject) => {
            client.verify.services(serviceSid).verifications.create({
                to: `+91${noData.phone}`,
                channel: "sms"
            }).then((res) => {
                res.valid = true;
                resolve(res)
            }).catch((error) => {
                reject(error)
            })
        })
    },
    otpVerify: (otpData, nuData) => {
        let resp = {}
        return new Promise(async (resolve, reject) => {
            client.verify.services(serviceSid).verificationChecks.create({
                to: `+91${nuData.phone}`,
                code: otpData.otp
            }).then((resp) => {
                resolve(resp)
            }).catch((error) => {
                reject(error)
            })
        })
    },
}