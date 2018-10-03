/* 
    A helper module to perform account operations in MongoDB
    Travis Ryan
    September 2018
*/

// Login helper function to facilitate querying the database for username/password
module.exports.loginUser = function (username, password, mongoClient, mongoConnectionUrl, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) { // For connection errors
            console.log(err); // Log the error
            callback(false); // Callback with login failure
        } else {
            var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
            var query = { // Object to represent the user's login attempt
                username: username,
                password: password
            };
            dbObject.collection("user").find(query).toArray(function (err, result) { // Query the user collection
                if (err) { // For query errors
                    console.log(err); // Log error
                    callback(false); // Callback with login failure
                } else {
                    db.close(); // close Mongo connection
                    if (result != "") // Login was successful
                        callback(true); // callback with login success
                    else
                        callback(false); // Username/Password incorrect, callback with login failure
                }
            });
        }
    });
}

// Utility function for adding a new user into the database
// TODO: Adjust logic for returning "success" or "failed" registration
module.exports.registerUser = function (newUsername, newPassword, newEmail, mongoClient, mongoConnectionUrl, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) throw err; // Throw connection errors
        var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
        var newUser = { // Object to represent the new user
            username: newUsername,
            password: newPassword,
            email: newEmail,
            joinDate: new Date() // create new Date object for user's join date
        };
        dbObject.collection("user").insertOne(newUser, function (err, res) { // Insert function
            if (err) { //error inserting new user
                console.log(err); // log error
                callback(false); // callback with failed registration
            } else { // successful registration
                console.log("New user has been inserted!"); // Log success message
                db.close(); // Close connection to database
                callback(true); // callback with successful register   
            }
        });
    });
}

// TODO: Finish this method
module.exports.getUser = function (mongoClient, mongoConnectionUrl, username, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) {
            console.log(err); // log mongo error to server
            callback(-1, -1); // return failure indicator
        };
        var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
        dbObject.collection("user").insertOne(newUser, function (err, result) { // Insert function
            if (err) { //error inserting new user
                console.log(err); // log error
                callback(false); // callback with failed registration
            } else { // successful registration
                console.log("New user has been inserted!"); // Log success message
                db.close(); // Close connection to database
                callback(true); // callback with successful register   
            }
        });
    });
}