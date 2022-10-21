var db = require('../config/connection')
var collection = require('../config/collection')
const bcrypt = require('bcrypt')
const { ObjectId } = require('mongodb');
const { response } = require('../app');

const Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_FWc2ABiabPmd8e',
    key_secret: 'Jr57a3TbQ3CVqWw9BHR982jo',
});

module.exports = {
    doUserSignup: (userData) => {
        return new Promise((resolve, reject) => {
            let ststus = false
            userData.password = bcrypt.hashSync(userData.password, 10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then(() => {
                resolve()
            })

        })

    },


    doUserLogin: (userData) => {
        return new Promise(async (resolve, reject) => {
            let status = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({ number: userData.number })
            if (user) {
                bcrypt.compare(userData.password, user.password).then((status) => {
                    if (status) {
                        console.log("login success")
                        response.user = user
                        response.status = true
                        resolve(response)
                    } else {

                        console.log("login failed")
                        resolve({ status: false })

                    }
                })
            } else {
                console.log("failed")
                resolve({ status: false })

            }
        })
    },


    addToCart: (proId, userId) => {
        let proObj = {
            item: ObjectId(proId),
            quantity: 1
        }
        return new Promise(async (resolve, reject) => {
            let userCart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (userCart) {
                let proExist = userCart.products.findIndex(product => product.item == proId)
                if (proExist != -1) {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId), 'products.item': ObjectId(proId) },
                        {
                            $inc: { 'products.$.quantity': 1 }
                        }).then(() => {
                            resolve()
                        })
                } else {
                    db.get().collection(collection.CART_COLLECTION).updateOne({ user: ObjectId(userId) },
                        {
                            $push: { products: proObj }
                        }
                    ).then((response) => {
                        resolve()
                    })
                }
            } else {
                let cartObj = {
                    user: ObjectId(userId),
                    products: [proObj]
                }
                db.get().collection(collection.CART_COLLECTION).insertOne(cartObj).then((response) => {
                    resolve()
                })
            }
        })
    },

    getCartProducts: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cartItems = await db.get().collection(collection.CART_COLLECTION).aggregate([
                {
                    $match: { user: ObjectId(userId) }
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
                }

            ]).toArray()
            resolve(cartItems)
        })
    },


    getCartCount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let count = 0
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            if (cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    },

    


    changeProductQuantity: (details) => {
        details.count = parseInt(details.count);
        details.quantity = parseInt(details.quantity);
        return new Promise((resolve, reject) => {
            if (details.count == -1 && details.quantity == 1) {
                db.get()
                    .collection(collection.CART_COLLECTION)
                    .updateOne(
                        { _id: ObjectId(details.cart) },
                        {
                            $pull: { products: { item: ObjectId(details.product) } },
                        }
                    )
                    .then((response) => {
                        resolve({ removeProduct: true });
                    });
            } else {
                db.get()
                    .collection(collection.CART_COLLECTION)
                    .updateOne(
                        {
                            _id: ObjectId(details.cart),
                            "products.item": ObjectId(details.product),
                        },
                        {
                            $inc: { "products.$.quantity": details.count },
                        }
                    )
                    .then((response) => {
                        resolve({ status: true });
                    });
            }
        });
    },


    getTotalAmount: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db
                .get()
                .collection(collection.CART_COLLECTION)
                .findOne({ user: ObjectId(userId) });

            if (cart) {
                let total = await db
                    .get()
                    .collection(collection.CART_COLLECTION)
                    .aggregate([
                        {
                            $match: { user: ObjectId(userId) },
                        },
                        {
                            $unwind: "$products",
                        },
                        {
                            $project: {
                                item: "$products.item",
                                quantity: "$products.quantity",
                            },
                        },
                        {
                            $lookup: {
                                from: collection.PRODUCT_COLLECTION,
                                localField: "item",
                                foreignField: "_id",
                                as: "products",
                            },
                        },
                        {
                            $project: {
                                item: 1,
                                quantity: 1,
                                product: { $arrayElemAt: ["$products", 0] },
                            },
                        },

                        {
                            $group: {
                                _id: null,
                                total: {
                                    $sum: {
                                        $multiply: [
                                            "$quantity",
                                            { $convert: { input: "$product.price", to: "int" } },
                                        ],
                                    },
                                },
                            },
                        },
                    ])
                    .toArray();
                resolve(total[0]?.total);
            } else {
                resolve(0);
            }
        });
    },


    placeOrder: (order, products, total) => {
        return new Promise((resolve, reject) => {
            console.log(order, products, total)
            let status = order['paymentMethod'] === 'COD' ? 'placed' : 'pending'
            let orderObj = {
                deliveryDetails: {
                    name: order.name,
                    mobile: order.mobile,
                    address: order.address,
                    totalAmount: total,
                    pincode: order.pincode
                },
                userId: ObjectId(order.userId),
                paymentMethod: order['paymentMethod'],
                products: products,
                status: status,
                date: Date(),
            }

            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response) => {
                db.get().collection(collection.CART_COLLECTION).deleteOne({ user: ObjectId(order.userId) })
                resolve(response.insertedId)
            })

        })
    },

    getCartProductList: (userId) => {
        return new Promise(async (resolve, reject) => {
            let cart = await db.get().collection(collection.CART_COLLECTION).findOne({ user: ObjectId(userId) })
            resolve(cart.products)
        })
    },

    getUserOrders: (userId) => {
        return new Promise(async (resolve, reject) => {
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({ userId: ObjectId(userId) }).toArray()
            resolve(orders)
        })
    },

    getOrderProducts: (orderId) => {
        return new Promise(async (resolve, reject) => {
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: { _id: ObjectId(orderId) }
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
                }

            ]).toArray()
            resolve(orderItems)
        })
    },


    generateRazorpay: (orderId,total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount:total*100,
                currency:"INR",
                receipt:""+orderId
            };
            instance.orders.create(options, function(err,order){
                console.log(order)
                resolve(order)
                
            })
           
        })
    },

    verifyPayment:(details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require ('crypto');
            let hmac  = crypto.createHmac('sha256','Jr57a3TbQ3CVqWw9BHR982jo')
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]']);
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }

        })
    },

    changePaymentStatus:(orderId)=>{
        return new Promise ((resolve,reject)=>{
            db
            .get()
            .collection(collection.ORDER_COLLECTION)
            .updateOne({_id:ObjectId(orderId)},
            {
                $set:{
                    status:'placed',
                },
            }).then(()=>{
                resolve()
            })

        })
    },

    // deleteCart: (cartId) => {
    //     return new Promise((resolve, reject) => {
    //         try {
    //             db.get()
    //                 .collection(collection.CART_COLLECTION)
    //                 .deleteOne({ item: ObjectId(details.product) })
    //                 .then((response) => {
    //                     resolve(response);
    //                 });
    //         }
    //         catch (error) {
    //             reject(error)
    //         }
    //     });
    // },


};