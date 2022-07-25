const db = require('../config/connection');
const collection = require('../config/collections');
const objectid = require('mongodb').ObjectId

module.exports = {
    addBikeTypes: (type) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.ADMIN_COLLECTION).updateOne({}, { $push: { types: type } }).then((data) => {
                resolve(data.insertedId)
            }).catch((error) => {
                reject(error)
            })
        })
    },
    getAllBikeTypes: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let bikeTypes = await db.get().collection(collection.ADMIN_COLLECTION).find().toArray()
                resolve(bikeTypes)
            } catch (error) {
                reject(error)
            }
        })
    },
    // editBikeTypes:(index)=>{
    //     return new Promise(async(resolve,reject)=>{
    //         try {
    //             db.get().collection(collection.ADMIN_COLLECTION).updateOne({},{$set:{[types.index]:}}).then((data)=>{
    //                 resolve()
    //             })
    //         } catch (error) {
    //             reject(error)
    //         }
    //     })
    // },
    deleteBikeTypes: (name) => {
        return new Promise(async (resolve, reject) => {
            db.get().collection(collection.ADMIN_COLLECTION).updateOne({}, { $pull: { types: name } }).then((data) => {
                resolve()
            }).catch((error) => {
                reject(error)
            })
        })
    },
    addProduct: (product, callback) => {
        product.price = +product.price;
        product.stock = +product.stock
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.insertedId)
        })
    },
    getAllProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },
    searchProducts: (key) => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION)
                    .find({
                        "$or": [
                            {
                                name: { $regex: key, $options: 'i' }
                            },
                            {
                                category: { $regex: key, $options: 'i' }
                            }
                        ]
                    }).toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },
    getLatestProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().sort({ _id: -1 }).limit(3).toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },
    getPopularProducts: () => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    {
                        $project: {
                            _id: 1,
                            name: 1,
                            price: 1,
                            wishList: 1,
                            length: { $size: "$wishList" }
                        }
                    },
                    {
                        $sort: { length: -1 }
                    },
                    {
                        $limit: 3
                    }
                ]).toArray()
                resolve(products)
            } catch (error) {
                reject(error)
            }
        })
    },
    getProductsByCategory: (category) => {
        return new Promise(async (resolve, reject) => {
            try {
                let products = await db.get().collection(collection.PRODUCT_COLLECTION).find({ category: category }).toArray()
                resolve(products);
            } catch (error) {
                reject(error)
            }
        })
    },
    filterProducts: (filter, price) => {
        return new Promise((resolve) => {
            if (filter.length > 1) {
                db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    {
                        $match:
                        {
                            $or: filter
                        }
                    },
                    {
                        $match:
                        {
                            price: { $lt: price }
                        }
                    }
                ]).toArray()
                    .then((products) => {
                        resolve(products)
                    })
            } else {
                db.get().collection(collection.PRODUCT_COLLECTION).aggregate([
                    {
                        $match:
                        {
                            price: { $lt: price }
                        }
                    }
                ]).toArray()
                    .then((products) => {
                        resolve(products)
                    })
            }

        })
    },
    getProductDetails: (id) => {
        return new Promise(async (resolve, reject) => {
            try {
                let product = await db.get().collection(collection.PRODUCT_COLLECTION).findOne({ _id: objectid(id) })
                resolve(product)
            } catch (error) {
                reject(error)
            }
        })
    },
    updateProduct: (prdtID, productDetails) => {
        return new Promise((resolve, reject) => {
            db.get().collection(collection.PRODUCT_COLLECTION).updateOne({ _id: objectid(prdtID) }, {
                $set: {
                    name: productDetails.name,
                    company: productDetails.company,
                    category: productDetails.category,
                    type: productDetails.type,
                    description: productDetails.description,
                    price: +productDetails.price,
                    stock: +productDetails.stock,
                    stock17inch: productDetails.stock17inch,
                    stock19inch: productDetails.stock19inch,

                }
            }).then((response) => {
                resolve(response)
            }).catch((error) => {
                reject(error)
            })
        })
    },
    deleteProduct: (prdtId) => {
        return new Promise(async (resolve, reject) => {
            try {
                let response = await db.get().collection(collection.PRODUCT_COLLECTION).deleteOne({ _id: objectid(prdtId) })
                resolve(response)
            } catch (error) {
                reject(error)
            }
        })
    }
}