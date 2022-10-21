const db = require("../config/connection")
const collection = require("../config/collection");
const { ObjectId } = require('mongodb')



module.exports = {

	addProduct: (product, images) => {
		images.forEach((image) => {
			image._id = new ObjectId();

		})

		const { brand, productName, type, category, description, price, stock } = product;

		const productObject = {

			brand,
			productName,
			type,
			category,
			description,
			price,
			stock,
			images
		};


		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PRODUCT_COLLECTION)
				.insertOne(productObject)
				.then((data) => {
					resolve();
				});
		});

	},

	getAllproducts: () => {
		return new Promise(async (resolve, reject) => {
			let products = await db.get().collection(collection.PRODUCT_COLLECTION).find().toArray()
			resolve(products)
		})
	},


	getProductsDetails: (proId) => {
		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PRODUCT_COLLECTION)
				.findOne({ _id: ObjectId(proId) })
				.then((products) => {
					resolve(products)
				})
		})
	},


	updateProducts: (product, proId, images) => {

		images.forEach((image) => {
			image._id = new ObjectId();
		});

		const { brand, productName, type, category, price, description, stock } = product;
		const productObject = {
			brand,
			productName,
			category,
			type,
			description,
			price,
			stock,
			images,
		};


		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PRODUCT_COLLECTION)
				.updateOne(
					{ _id: ObjectId(proId) },
					{
						$set: {
							...productObject,
						},
					}
				)
				.then(() => {
					resolve();
				});
		});
	},

	getUpdatedProducts: (proId) => {
		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PRODUCT_COLLECTION)
				.findOne({ _id: ObjectId(proId) })
				.then((product) => {
					resolve(product)
				})
		})
	},


	deleteProduct: (productId) => {
		return new Promise((resolve, reject) => {
			try {
				db.get()
					.collection(collection.PRODUCT_COLLECTION)
					.deleteOne({ _id: ObjectId(productId) })
					.then((response) => {
						resolve(response);
					});
			}
			catch (error) {
				console.log(error);
				reject(error)
			}
		});
	},


	getSingleProDetails: (proId) => {
		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PRODUCT_COLLECTION)
				.findOne({ _id: ObjectId(proId) })
				.then((product) => {
					resolve(product)
				})
		})
	},


	getUserOrders: () => {
		return new Promise((resolve, reject) => {
			let orders = db.get().collection(collection.ORDER_COLLECTION).find().toArray()
			resolve(orders)
			console.log(orders)
		})
	},

    acceptOrders:(orderId)=>{
		return new Promise(async(resolve,reject)=>{
			await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{$set:{status:"Shipped"}}).then((response)=>{
				resolve(response)
				console.log(response);
			})
	
		})
	},


	declineOrders:(orderId)=>{
		return new Promise(async(resolve,reject)=>{
			await db.get().collection(collection.ORDER_COLLECTION).updateOne({_id:ObjectId(orderId)},{$set:{status:"Cancelled"}}).then((response)=>{
				resolve(response)
				console.log(response);
			})
	
		})
	},



	///////////  Category Session /////////////



	addCategory: (category, image) => {
		image._id = new ObjectId();
		const { categoryName } = category;
		const categoryObject = {
			categoryName,
			image,
		};
		return new Promise((resolve, reject) => {
			try {
				db.get()
					.collection(collection.CATEGORY_COLLECTION)
					.insertOne(categoryObject)
					.then((data) => {
						console.log(data);
						resolve();

					});
			}
			catch (error) {
				console.log(error);
				reject(error)
			}
		});
	},



	getCategory: (catId) => {

		return new Promise(async (resolve, reject) => {
			try {
				let category = await db.get()
					.collection(collection.CATEGORY_COLLECTION).find()
					.toArray();
				resolve(category);
			}
			catch (error) {
				reject(error);
			}
		})
	},



	getCategoryDetails: (catId) => {
		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.CATEGORY_COLLECTION)
				.findOne({ _id: ObjectId(catId) })
				.then((category) => {
					resolve(category)
				})
		})
	},

	updateCategory: (catDetails, catId, image) => {
		const updateObject = {
			categoryName: catDetails.category,
		};
		if (image) {
			image._id = new ObjectId();
			updateObject.image = image;
		}
		const { category } = catDetails;
		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.CATEGORY_COLLECTION)
				.updateOne(
					{ _id: ObjectId(catId) },
					{
						$set: { ...updateObject },
					}
				)
				.then((response) => {
					resolve();
				});
		});
	},

	getAllCategory: () => {
		return new Promise(async (resolve, reject) => {
			try {
				let category = await db.get()
					.collection(collection.CATEGORY_COLLECTION).find()
					.toArray();
				resolve(category);
			}
			catch (error) {
				reject(error);
			}
		})
	},


	deleteCategory: (catId) => {
		return new Promise((resolve, reject) => {
			try {
				db.get()
					.collection(collection.CATEGORY_COLLECTION)
					.deleteOne({ _id: ObjectId(catId) })
					.then((response) => {
						resolve(response);
					});
			}
			catch (error) {
				console.log(error);
				reject(error)
			}
		});
	},





	// Umpire Session //

	addUmpire: (umpire, images) => {
		images.forEach((image) => {
			image._id = new ObjectId();

		})
		const { umpireName, year } = umpire;
		const umpireObject = {

			umpireName, year, images
		};

		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.UMPIRE_COLLECTION)
				.insertOne(umpireObject)
				.then((data) => {
					resolve();
				});
		});

	},

	getAllUmpires: () => {
		return new Promise(async (resolve, reject) => {
			let umpires = await db.get().collection(collection.UMPIRE_COLLECTION).find().toArray()
			resolve(umpires)
		})
	},


	deleteUmpire: (umpireId) => {
		return new Promise((resolve, reject) => {
			try {
				db.get()
					.collection(collection.UMPIRE_COLLECTION)
					.deleteOne({ _id: ObjectId(umpireId) })
					.then((response) => {
						resolve(response);
					});
			}
			catch (error) {
				console.log(error);
				reject(error)
			}
		});
	},



	// official session //

	addOfficial: (officials, images) => {
		images.forEach((image) => {
			image._id = new ObjectId();

		})
		const { officialName, position } = officials;
		const officialObject = {

			officialName, position, images
		};

		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.OFFICIAL_COLLECTION)
				.insertOne(officialObject)
				.then((data) => {
					resolve();
				});
		});

	},

	getAllOfficials: () => {
		return new Promise(async (resolve, reject) => {
			let officials = await db.get().collection(collection.OFFICIAL_COLLECTION).find().toArray()
			resolve(officials)
		})
	},

	deleteOfficial: (officialId) => {
		return new Promise((resolve, reject) => {
			try {
				db.get()
					.collection(collection.OFFICIAL_COLLECTION)
					.deleteOne({ _id: ObjectId(officialId) })
					.then((response) => {
						resolve(response);
					});
			}
			catch (error) {
				console.log(error);
				reject(error)
			}
		});
	},



	// Player Session //


	addPlayer: (players, images) => {
		images.forEach((image) => {
			image._id = new ObjectId();

		})
		const { playerName, style, wk, dob, gender, bowlstyle } = players;
		const playersObject = {

			playerName, dob, style, wk, bowlstyle, gender, images
		};

		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PLAYER_COLLECTION)
				.insertOne(playersObject)
				.then((data) => {
					resolve();
				});
		});

	},


	getAllPlayers: () => {
		return new Promise(async (resolve, reject) => {
			var sort = { playerName: 1 };
			let players = await db.get().collection(collection.PLAYER_COLLECTION).find().sort(sort).toArray()
			resolve(players)
		})
	},

	deletePlayer: (playerId) => {
		return new Promise((resolve, reject) => {
			try {
				db.get()
					.collection(collection.PLAYER_COLLECTION)
					.deleteOne({ _id: ObjectId(playerId) })
					.then((response) => {
						resolve(response);
					});
			}
			catch (error) {
				console.log(error);
				reject(error)
			}
		});
	},


	getPlayerDetails: (pyrId) => {
		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.PLAYER_COLLECTION)
				.findOne({ _id: ObjectId(pyrId) })
				.then((players) => {
					resolve(players)
				})
		})
	},


	// news session //

	addNews: (News) => {

		const { news, headline, month, eventdate } = News;
		const newsObject = {

			news, headline, month, eventdate
		};

		return new Promise((resolve, reject) => {
			db.get()
				.collection(collection.NEWS_COLLECTION)
				.insertOne(newsObject)
				.then((data) => {
					resolve();
				});
		});

	},


	getNews: () => {
		return new Promise(async (resolve, reject) => {
			let News = await db.get().collection(collection.NEWS_COLLECTION).find().toArray()
			resolve(News)
		})
	},

	deleteNews: (newsId) => {
		return new Promise((resolve, reject) => {
			try {
				db.get()
					.collection(collection.NEWS_COLLECTION)
					.deleteOne({ _id: ObjectId(newsId) })
					.then((response) => {
						resolve(response);
					});
			}
			catch (error) {
				console.log(error);
				reject(error)
			}
		});
	},



};
