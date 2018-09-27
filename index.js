// Node modules are imported as constants
const express = require("express"); // Express server
const path = require("path"); // For manipulating file paths
const fs = require("fs"); // For file I/O
const pug = require("pug"); // Pug templating engine
const session = require('express-session'); // Manages session variables
const mongoClient = require('mongodb').MongoClient; // Client for connecting to MongoDB
const bodyParser = require('body-parser'); // body parser for POST operation responses
const accountHelper = require("./accountHelper.js"); // Helper functions in an accountHelper module

// Gather secret vars (DB Username and Password)
const dbUser = JSON.parse(fs.readFileSync("secret.json"))["dbUser"]; // database username
const dbPassword = JSON.parse(fs.readFileSync("secret.json"))["dbPassword"]; // database password
const mongoConnectionUrl = "mongodb://" + dbUser + ":" + // mongo connection string
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

// Configure Express to store sessions
app.use(
    session({
        secret: JSON.parse(fs.readFileSync("secret.json"))["sessionSecret"], // session secret
        key: JSON.parse(fs.readFileSync("secret.json"))["sessionKey"], // session key
        resave: false, // don't resave session data
        saveUninitialized: true, // save uninitialized session data
        cookie: { // cookie settings
            httpOnly: false, // allow other than HTTP
            expires: new Date(Date.now() + 60 * 60 * 1000) // cookie expiration date
        }
    })
);

// Home Page Route
// If user is logged in, redirect to their dashboard. Otherwise, show register/login home page
app.get("/", function (req, res) {
    if (req.session.username) // if logged in
        res.render("dashboard"); // render user's dashboard
    else // if not logged in
        res.render("homepage"); // render home page (register/login)
});

// POST method for registering a user, redirects to dashboard on success
app.post("/register", function (req, res) {
    // Pass Request Body of parameters into a registerUser function
    accountHelper.registerUser(req.body.username, req.body.password, req.body.email, mongoClient, mongoConnectionUrl, function (registerSuccess) {
        if(registerSuccess)
            req.session.username = req.body.username;
        res.redirect("/"); // Redirect to home page (will redirect to dashboard if register was successful)
    });
});

// POST method for logging in a user, redirects to dashboard on success
app.post("/login", function (req, res) {
    // Pass Request Body of parameters into a login function
    accountHelper.loginUser(req.body.username, req.body.password, mongoClient, mongoConnectionUrl, function (loginAttemptSuccess) {
        if (loginAttemptSuccess) // If login was successful
            req.session.username = req.body.username; // store session data for username
        res.redirect("/"); // Redirect to home page (will redirect to dashboard if login was successful)
    });
});

app.get("/logout", function(req, res){
    req.session.destroy(); // destroy all session data
    res.redirect("/"); // redirect to home page
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