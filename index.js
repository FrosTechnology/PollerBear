// Node modules are imported as constants
const express = require("express"); // Express server
const path = require("path"); // For manipulating file paths
const fs = require("fs"); // For file I/O
const pug = require("pug");

// Gather secret vars (DB Username and Password)
const dbUser = JSON.parse(fs.readFileSync("secret.json"))["dbUser"];
const dbPassword = JSON.parse(fs.readFileSync("secret.json"))["dbPassword"];

// Setting up Express server
var app = express(); // Initialize Express server
app.set('view engine', 'pug'); // Use Pug to render HTML pages from views
app.use(express.static("public")); // publicly host assets so HTML can find them

// Home Page
app.get("/", function(req, res) {
    res.render("dashboard");
});

app.get("/account", function(req, res){
    res.render("test");
});

app.get("/polls", function(req, res){
    res.send("Polls page!");
});

app.get("/search", function(req, res){
    res.send("Search page!");
});

// Start listening on port 8080
app.listen(8080);
console.log("Listening at port 8080...");