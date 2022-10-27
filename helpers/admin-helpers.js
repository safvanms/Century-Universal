const db = require("../config/connection");
const collection = require("../config/collection");
const bcrypt = require("bcrypt");

module.exports = {
    adminLogin: (adminData) => {
        let loginStatus = false;
        let response = {};
        return new Promise(async (resolve, reject) => {
            try {
                let admin = await db
                    .get()
                    .collection(collection.ADMIN_COLLECTION)
                    .findOne({ username:adminData.username });
                if (admin) {
                    bcrypt.compare(adminData.password, admin.password).then((status) => {
                        if (status) {
                            response.admin = admin;
                            response.status = true;
                            resolve(response);
                        } else {
                            console.log("login failed");
                            resolve({ status: false });
                        }
                    });
                } else {
                    console.log("login failed");
                    resolve({ status: false });
                }
            } catch (error) {
                console.log(error);
                reject({ serverError: true });
            }
        });
    },

    
    
};