const db = require('../config/connection');
const collection = require('../config/collections');
const bcrypt = require('bcrypt');
const async = require('hbs/lib/async');
const { response } = require('express');
const objectid = require('mongodb').ObjectId;
const Razorpay = require('razorpay');
const { resolve } = require('path');
const dotenv=require("dotenv")
dotenv.config()
const instance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = {
    doSignup: (userData) => {
        userData.blockstatus = false
        return new Promise(async (resolve, reject) => {
            userData.password = await bcrypt.hash(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data) => {
                resolve(data.insertedId)
            })
        })
    },
    checkUnique: (userData) => {
        let valid = {}
        return new Promise(async (resolve, reject) => {
            try {
                let exist = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email })
                if (exist) {
                    valid.exist = true
                    resolve(valid)
                } else {
                    resolve(valid)
                }
            } catch (error) {
                reject(error)
            }
        })
    },
    doLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ email: userData.email, blockstatus: false })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        response.user = user;
                        response.status = true;
                        resolve(response);
                    } else {
                        resolve({ status: false })
                    }
                })
            } else {
                resolve({ status: false })
            }
        })
    },
    getAllUsers: () => {
        return new Promise(async (resolve, reject) => {
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    blockUser: (usrId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectid(usrId) }, {
                $set: {
                    blockstatus: true
                }
            }).then(() => {
                resolve(response)
            })
        })
    },
    unBlockUser: (usrId) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectid(usrId) }, {
                $set: {
                    blockstatus: false
                }
            }).then(() => {
                resolve(response)
            })
        })
    },
    getuserDetails: (usrId) => {
        return new Promise(async (resolve) => {
            let userDetails = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectid(usrId) })
            resolve(userDetails)
        })
    },
    editAccountDetails: (usrId, data) => {
        return new Promise(async (resolve) => {
            let response = await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectid(usrId) }, {
                $set: {
                    name: data.name,
                    phone: data.phone,
                    email: data.email
                }
            })
            resolve(response)
        })
    },
    addToWishList: (prdtId, usrId) => {
        return new Promise(async (resolve) => {
            let wishList = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectid(prdtId), wishList: usrId })
            if (wishList) {
                console.log(' wishlidted')
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectid(prdtId) }, {
                    $pull: {
                        wishList: usrId
                    }
                })
                resolve({ wishlisted: false })
            } else {
                console.log('not wihlisted')
                db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectid(prdtId) }, {
                    $push: {
                        wishList: usrId
                    }
                })
                resolve({ wishlisted: true })
            }
        })
    },
    deleteWishList: (prdtId, usrId) => {
        return new Promise((resolve) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectid(prdtId) }, {
                $pull: {
                    wishList: usrId
                }
            })
            console.log('selele')
            resolve({ deleted: true })
        })
    },
    getWishlistCount: (usrId) => {
        return new Promise(async (resolve) => {
            let wishlistCount = await db.get().collection(collection.PRODUCT_COLLECTION).count({ wishList: usrId })
            resolve(wishlistCount)
        })
    },
    getWishlistProducts(usrId) {
        return new Promise(async (resolve) => {
            let wishlist = await db.get().collection(collection.PRODUCT_COLLECTION).find({ wishList: usrId }).toArray()
            resolve(wishlist)
        })
    },
    addAddress: (address, usrId) => {
        address._id = objectid()
        return new Promise(async (resolve) => {
            let newAddress = await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectid(usrId) }, {
                $push: {

                    addresses: address
                }
            })
            resolve()
        })
    },
    getAllAddresses: (usrId) => {
        return new Promise(async (resolve) => {
            let address
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ _id: objectid(usrId) })
            address = user.addresses
            resolve(address)
        })
    },
    deleteAddress: (addresId, usrId) => {
        return new Promise(async (resolve) => {
            let response = await db.get().collection(collection.USER_COLLECTION).updateOne({ _id: objectid(usrId) }, {
                $pull: {
                    addresses: { _id: objectid(addresId) }
                }
            })
            resolve(response)
        })
    },
    addToCart: (prdtId, usrId, qnty) => {
        let proObj = {
            item: objectid(prdtId),
            quantity: parseInt(qnty)
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(usrId) })
            if (userCart) {
                let proExists = userCart.products.findIndex(product => product.item == prdtId)
                if (proExists != -1) {
                    db.get().collection(collection.CART_COLLECTION)
                        .updateOne({ user: objectid(usrId), 'products.item': objectid(prdtId) },
                            {
                                $inc: { 'products.$.quantity': proObj.quantity }

                            }).then(() => {
                                resolve()
                            })
                } else {
                    db.get().collection(collection.CART_COLLECTION).
                        updateOne({ user: objectid(usrId) },
                            {
                                $push: { products: proObj }
                            }
                        ).then((response) => {
                            resolve
                        })
                }
            } else {
                let cartObj = {
                    user: objectid(usrId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })

    },
    getCartproducts: (usrId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectid(usrId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
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
                    $addFields: {
                        totalPrice: {
                            $multiply: ['$quantity', '$product.price']
                        }
                    }
                }
            ]).toArray()
            if (cartItems) {
                resolve(cartItems)
            } else {
                resolve()
            }
        })
    },
    getCartCount: (usrId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0;
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: objectid(usrId) })
            if (cart) {
                count = cart.products.length;
            }
            resolve(count);
        })
    },
    changeProductQuantity: (details) => {
        count = parseInt(details.count);
        quantity = details.quantity
        return new Promise((resolve, reject) => {
            if (count == -1 && quantity == 1) {
                resolve({ status: false })
            } else {
                db.get().collection(collection.CART_COLLECTION)
                    .updateOne({ _id: objectid(details.cart), 'products.item': objectid(details.product) },
                        {
                            $inc: { 'products.$.quantity': count }

                        }).then((response) => {
                            resolve({ status: true })
                        })
            }

        })
    },
    deleteCartItem: (details) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.CART_COLLECTION)
                .updateOne({ _id: objectid(details.cart) },
                    {
                        $pull: { products: { item: objectid(details.product) } }
                    }
                ).then((response) => {
                    resolve()
                })
        })
    },
    getTotalAmount: (usrId) => {
        return new Promise(async (resolve, reject) => {
            let total = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: objectid(usrId) }
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup: {
                        from: collection.PRODUCT_COLLECTION,
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
                    $group: {
                        _id: null,
                        total: { $sum: { $multiply: ['$quantity', '$product.price'] } }
                    }
                }
            ]).toArray()
            if (total[0]) {
                resolve(total[0].total)
            } else {
                resolve()
            }
        })
    },
    placeOrder: (order, products, total) => {
        for (i = 0; i < products.length; i++) {
            products[i].orderStatus = 'Pending'
        }
        return new Promise((resolve) => {
            let status = order.payment === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    name: order.fname + " " + order.lname,
                    mobile: order.phone,
                    email: order.email,
                    address1: order.address1,
                    address2: order.address2,
                    state: order.state,
                    country: order.country,
                    pincode: order.pin_code,
                },
                userId: objectid(order.usrId),
                paymentMethod: order.payment,
                products: products,
                totalAmount: total,
                status: status,
                date: new Date().toString().slice(0, 25),
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: objectid(order.usrId) })
                for (i = 0; i < products.length; i++) {
                    db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectid(products[i].product._id) }, {
                        $inc: { stock: -products[i].quantity }
                    })
                }
                resolve(response.insertedId)
            })
        })

    },
    getUserOrders: (usrId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: objectid(usrId) }).sort({ _id: -1 }).toArray()
                resolve(orders)
            } catch (error) {
                reject(error)
            }
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: +total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: "" + orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err)
                } else {
                    console.log(order);
                    resolve(order)
                }
            });
        })
    },
    verifyPayment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)

            hmac.update(details['payment[razorpay_order_id]'] + '|' + details['payment[razorpay_payment_id]'])
            hmac = hmac.digest('hex')
            if (hmac == details['payment[razorpay_signature]']) {
                resolve()
            } else {
                reject()
            }
        })

    },
    changePaymentStatus: (orderId) => {
        return new Promise((resolve) => {
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectid(orderId) },
                    {
                        $set: {
                            status: 'placed'
                        }
                    }
                ).then(() => {
                    resolve()
                })
        })
    },
    cancelOrder: (data) => {
        return new Promise(async (resolve) => {
            const response = await db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({ _id: objectid(data.odrId), 'products.item': objectid(data.itemId) }, {
                    $set: {
                        'products.$.orderStatus': 'Order cancel-requested',
                    }
                })
            resolve(response)
        })
    }
}