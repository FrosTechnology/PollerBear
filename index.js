// Node modules are imported as constants
const express = require("express"); // Express server
const path = require("path"); // For manipulating file paths
const fs = require("fs"); // For file I/O
const pug = require("pug"); // Pug templating engine
const mongoClient = require('mongodb').MongoClient; // Client for connecting to MongoDB
const bodyParser = require('body-parser'); // body parser for POST operation responses

// Gather secret vars (DB Username and Password)
const dbUser = JSON.parse(fs.readFileSync("secret.json"))["dbUser"]; // database username
const dbPassword = JSON.parse(fs.readFileSync("secret.json"))["dbPassword"]; // database password
const mongoConnectionUrl = "mongodb://" + dbUser + ":" +  // mongo connection string
    encodeURIComponent(dbPassword) + "@ds115263.mlab.com:15263/pollerbear";

// Setting up Express server
var app = express(); // Initialize Express server
app.set('view engine', 'pug'); // Use Pug to render HTML pages from views
app.use(express.static("public")); // publicly host assets so HTML can find them

// Body Parser for JSON-Encoded bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: true
}));

// Home Page Route
// If user is logged in, redirect to their dashboard. Otherwise, show register/login home page
app.get("/", function (req, res) {
    res.render("homepage");
});

// POST method for registering a user, redirects to dashboard on success
app.post("/register", function (req, res) {
    // Pass Request Body of parameters into a registerUser function
    registerUser(req.body.username, req.body.password, req.body.email, function () {
        res.render("dashboard"); // Render the user's dashboard once registered
    });
});

function registerUser(newUsername, newPassword, newEmail, callback) {
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
            if (err) throw err; // Throw errors
            console.log("New user has been inserted!"); // Log success message
            db.close(); // Close connection to database
        });
    });
    callback();
}

// POST method for logging in a user. On success, redirects to a user's dashboard
app.post("/login", function (req, res) {
    // Pass Request Body of parameters into a login function
    loginUser(req.body.username, req.body.password, function (loginAttemptSuccess) {
        if (loginAttemptSuccess) // If login was successful
            res.render("dashboard"); // Render the user's dashboard
        else
            res.redirect("/"); // If login failed, redirect to the home page without logging in
    });
});

// Login helper function to facilitate querying the database for username/password
function loginUser(username, password, callback) {
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

app.get("/account", function (req, res) {
    res.render("dashboard");
});

app.get("/polls", function (req, res) {
    res.send("Polls page!");
});

app.get("/search", function (req, res) {
    res.send("Search page!");
});

// Start listening on port 8080
app.listen(8080);
console.log("Listening at port 8080...");