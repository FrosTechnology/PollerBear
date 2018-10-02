/*
    Index.js - All major logic for page routing and rendering
    Travis Ryan - September 2018
    CS396 Intermediate Software Project
*/

// Node modules are imported as constants
const express = require("express"); // Express server
const path = require("path"); // For manipulating file paths
const fs = require("fs"); // For file I/O
const pug = require("pug"); // Pug templating engine
const session = require('express-session'); // Manages session variables
const mongoClient = require('mongodb').MongoClient; // Client for connecting to MongoDB
const bodyParser = require('body-parser'); // body parser for POST operation responses
const accountHelper = require("./accountHelper.js"); // Helper functions in an accountHelper module
const pollHelper = require("./pollHelper.js") // Helper functions in a pollHelper module

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
    if (req.session.username){ // if logged in
        pollHelper.getRecentPolls(mongoClient, mongoConnectionUrl, function(results){
            res.render("dashboard", {
                recentPolls: results
            });
        }); 
    }
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

// POST method for submitting a new poll
app.post("/newpoll", function (req, res) {
    // Pass Request Body of parameters into a registerUser function
    pollHelper.newPoll(req.session.username, req.body, mongoClient, mongoConnectionUrl, function (newPollId) {
        if(newPollId!=-1)
            res.redirect("/poll?pollId="+newPollId); // Redirect to new poll if create was successful
        else
            res.redirect("/newpoll?error=true");
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

// Route for a page to create a new poll
// User must be logged in to access
app.get("/newpoll", function (req, res) {
    if(req.session.username) // if logged in
        res.render("newpoll"); // render "new poll" page
    else // if not logged in
        res.redirect("/"); // redirect to home page
});

// Route for voting in a poll
// TODO: If the user has voted in the poll, redirect to the poll's results
app.get("/poll", function (req, res) {
    if(req.query.pollId){
        pollHelper.getPollById(mongoClient, mongoConnectionUrl, req.query.pollId, function(result){
            res.render("poll", {
                pollData : result[0],
                username : req.session.username
            });
        });
    }
    else
        res.send("/");
});

app.get("/vote", function (req, res){
    if(req.query.pollId && req.query.vote && req.session.username){ // user must be logged in and provide pollId and their vote
        pollHelper.voteInPoll(mongoClient, mongoConnectionUrl, req.query.pollId, // call external method to vote in poll
            req.query.vote, req.session.username, function(successIndicator){ // callback
                if(successIndicator!=-1)
                    res.redirect("/pollresults?pollId="+req.query.pollId);
                else
                    res.redirect("/poll?pollId="+req.query.pollId);
        });
    } else{ // redirect to home page if there is an error with inputs
        res.redirect("/");
    }
});

// Route for showing a user the results of a poll
// User MUST have voted in the poll to see the results
app.get("/pollresults", function(req, res){
    if(req.query.pollId && req.session.username){
        pollHelper.getPollResults(mongoClient, mongoConnectionUrl, req.query.pollId, function(allVotes, resultOfPollQuery){
            if(resultOfPollQuery==-1 || allVotes==-1) // some error occurred in gathering the votes
                res.redirect("/poll?pollId="+req.query.pollId); // redirect to voting page
            else{ // poll results gathered successfully
                votesCounter = {}; // initialize an object for storing a count of all the votes
                for(var i = 0; i < resultOfPollQuery[0]["pollOptions"].length; i++) // loop through the poll's options
                    votesCounter[resultOfPollQuery[0]["pollOptions"][i]] = 0; // add a possible option to the object
                var userHasVotedInThisPoll = false; // initialize boolean such that user has not voted in the poll
                for(var i = 0; i < allVotes.length; i++){ // loop through all votes
                    if(allVotes[i]["username"]===req.session.username){ // flagger for user's vote
                        userHasVotedInThisPoll = true; // set flag to true
                        userVoteData = allVotes[i]; // keep track of the user's vote information (choice and date)
                    }
                    votesCounter[allVotes[i]["voteChoice"]] = votesCounter[allVotes[i]["voteChoice"]] + 1; // increment its count by 1
                }
                if(!userHasVotedInThisPoll){ // user hasn't voted in the poll
                    console.log("User hasn't voted in this poll."); // log server indicator that user has not voted
                    res.redirect("/poll?pollId="+req.query.pollId); // redirect to voting page if user has not voted
                }
                else{ // user has voted in the poll
                    res.render("pollresults", { // render the results page
                        pollData: resultOfPollQuery, // pass in the poll data
                        allVotes: allVotes, // pass in all results
                        userVoteData : userVoteData, // pass in the user's vote information
                        votesCounter : votesCounter // pass in the counts of all the votes (for graph building and percentage calculation)
                    });
                } 
            }
        });
    } else { // no poll ID was given, or user isn't logged in
        res.redirect("/"); // redirect to home page
    }
});

// Route for a polls page
app.get("/polls", function (req, res) {
    res.send("Polls page!");
});

// Route for a search page. User should input some "searchTerm" in the header for searching polls
// User must be logged in to search, or is redirected to home page
app.get("/search", function (req, res) {
    if(!req.session.username) // if not logged in
        res.redirect("/"); // redirect to home page
    else{ // if logged in
        if(req.query.searchTerm) // if search term set in header
            var searchTerm=req.query.searchTerm; // set searchTerm variable
        else // search term not given
            var searchTerm = ""; // assume an empty string
        pollHelper.searchPolls(mongoClient, mongoConnectionUrl, searchTerm, function(results){
            if(results!=-1){ // no errors in searching Mongo
                console.log(results);
                res.render("search", {
                    results : results,
                    searchTerm: searchTerm
                });
            } else
                res.redirect("/"); // redirect to home page for errors
        });
    }
});

// Account page for a user
app.get("/account", function(req, res){
    if(!req.session.username) // user must be logged in
        res.redirect("/"); // else redirect to home page for login
    else{
        res.render("account", { // render account view
            username: req.session.username // pass in the session username
        });
    }
});

/* Redirect unknown page routes to home page
app.get("/*", function (req, res) {
    res.redirect("/");
});*/

// Start listening on port 8080
app.listen(8080);
console.log("Listening at port 8080...");