const db = require('../config/connection');
const collection = require('../config/collections');
const bcrypt = require('bcrypt');
const objectid = require('mongodb').ObjectId

module.exports = {
    doLogin: (adminData) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = {}
                let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({ email: adminData.email })
                if (admin) {
                    bcrypt.compare(adminData.password, admin.password).then((status) => {
                        if (status) {
                            response.admin = admin;
                            response.status = true;
                            resolve(response);
                        } else {
                            resolve({ status: false })
                        }
                    })
                } else {
                    resolve({ status: false })
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    doMessage: (message) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await db.get().collection(collection.ADMIN_COLLECTION).updateOne({}, {
                    $push: {
                        messages: message
                    }
                })
                resolve(response)
            } catch (error) {
                reject(error)
            }
        })
    },
    getUsersCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let userCount = await db.get().collection(collection.USER_COLLECTION).count()
                if (userCount) {
                    resolve(userCount)
                } else {
                    resolve(userCount = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getProductsCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let productsCount = await db.get().collection(collection.PRODUCT_COLLECTION).count()
                if (productsCount) {
                    resolve(productsCount)
                } else {
                    resolve(productsCount = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getPlacedOrdersCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let placedorders;
                placedorders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: { 'status': 'placed' }
                    },
                    {
                        $count: 'number'
                    }
                ]).toArray()
                if (placedorders[0]) {
                    resolve(placedorders[0].number)
                } else {
                    resolve(placedorders = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getShippedOrdersCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let shippedorders;
                shippedorders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: { 'status': 'placed', 'products.orderStatus': 'Shipped' }
                    },
                    {
                        $count: 'number'
                    }
                ]).toArray()
                if (shippedorders[0]) {
                    resolve(shippedorders[0].number)
                } else {
                    resolve(shippedorders = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getOrdersCount: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let userCount
                userCount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: { 'products.orderStatus': 'Delivered', 'status': 'placed' }
                    },
                    {
                        $count: 'number'
                    }
                ]).toArray()
                if (userCount[0]) {
                    resolve(userCount[0].number)
                } else {
                    resolve(userCount = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getCanceledOrders: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let canceledOrders
                canceledOrders = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: { 'products.orderStatus': 'Order Canceled', 'status': 'placed' }
                    },
                    {
                        $count: 'number'
                    }
                ]).toArray()
                if (canceledOrders[0]) {
                    resolve(canceledOrders[0].number)
                } else {
                    resolve(canceledOrders = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getTotalSales: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let sales = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: { 'products.orderStatus': 'Delivered', 'status': 'placed' }
                    },
                    {
                        $group: {
                            _id: null,
                            total: { $sum: '$totalAmount' }
                        }
                    }
                ]).toArray()
                if (sales[0]) {
                    resolve(sales[0].total)
                } else {
                    resolve(sales = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getCODsales: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let codamount
                codamount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: {
                            'products.orderStatus': 'Delivered',
                            'paymentMethod': 'COD',
                            'status': 'placed'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: '$totalAmount'
                            }
                        }
                    }
                ]).toArray()
                if (codamount[0]) {
                    resolve(codamount[0].total)
                } else {
                    resolve(codamount = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    getOnlineSales: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let onlineamount
                onlineamount = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                    {
                        $unwind: '$products'
                    },
                    {
                        $match: {
                            'products.orderStatus': 'Delivered',
                            'paymentMethod': 'RAZORPAY',
                            'status': 'placed'
                        }
                    },
                    {
                        $group: {
                            _id: null,
                            total: {
                                $sum: '$totalAmount'
                            }
                        }
                    }
                ]).toArray()
                if (onlineamount[0]) {
                    resolve(onlineamount[0].total)
                } else {
                    resolve(onlineamount = 0)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    addBanner: (banner, callback) => {
        banner.active = false;
        db.get().collection(collection.BANNER_COLLECTION).insertOne(banner).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllbanners: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let banners = await db.get().collection(collection.BANNER_COLLECTION).find().toArray()
                resolve(banners)
            } catch (error) {
                reject(error)
            }
        })
    },
    activateBanner: (bannerId) => {
        return new Promise(async (resolve, reject) => {
            try {
                db.get().collection(collection.BANNER_COLLECTION).updateMany({}, {
                    $set: {
                        active: false
                    }
                })
                let banner = await db.get().collection(collection.BANNER_COLLECTION).
                    updateOne({ _id: objectid(bannerId) }, {
                        $set: {
                            active: true
                        }
                    })
                resolve(banner)
            } catch (error) {
                reject(error)
            }
        })
    },
    deActivateBanner: (bannerId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let banner = await db.get().collection(collection.BANNER_COLLECTION).
                    updateOne({ _id: objectid(bannerId) }, {
                        $set: {
                            active: false
                        }
                    })
                resolve(banner)
            } catch (error) {
                reject(error)
            }
        })
    },
    getBanner: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let banner = await db.get().collection(collection.BANNER_COLLECTION).findOne({ active: true })
                resolve(banner)
            } catch (error) {
                reject(error)
            }
        })
    },
    deleteBanner: (bannerId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await db.get().collection(collection.BANNER_COLLECTION).deleteOne({ _id: objectid(bannerId) })
                resolve(response)
            } catch (error) {
                reject(error)
            }
        })
    },
    getAllOrders: () => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ORDER_COLLECTION).find().sort({ _id: -1 }).toArray().then((response) => {
                resolve(response)
            }).catch((error) => {
                reject(error)
            })
        })
    },
    changeOrderDelivery: (data) => {
        return new Promise(async (resolve, reject) => {
            try {
                if (data.deliveryStatus == 'Delivered' || data.deliveryStatus == 'Order Canceled') {
                    let response = await db.get().collection(collection.ORDER_COLLECTION)
                        .updateOne({ _id: objectid(data.orderId), 'products.item': objectid(data.itemId) }, {
                            $set: {
                                'products.$.orderStatus': data.deliveryStatus,
                                'products.$.iscanceled': true,
                                'products.$.invoice':true
                            }
                        })
                    resolve(response)
                } else {
                    let response = await db.get().collection(collection.ORDER_COLLECTION)
                        .updateOne({ _id: objectid(data.orderId), 'products.item': objectid(data.itemId) }, {
                            $set: {
                                'products.$.orderStatus': data.deliveryStatus,
                            }
                        })
                    resolve(response)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
}