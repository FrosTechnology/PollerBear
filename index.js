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
const mongoConnectionUrl = "mongodb://" + dbUser + ":" + encodeURIComponent(dbPassword) + "@ds115263.mlab.com:15263/pollerbear"; // mongo connection string

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
    // Pass Request Body of parameters into the registerUser function
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

app.post("/login", function (req, res) {
    res.render("dashboard");
});


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