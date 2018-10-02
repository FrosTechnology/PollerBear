/* 
    A helper module to perform poll access/manipulation operations in MongoDB
    Travis Ryan
    September 2018
*/

// Utility function for adding a new poll into the database
// Takes the user's username, the form with the poll options, mongo Connection information, and a callback
module.exports.newPoll = function (username, pollBody, mongoClient, mongoConnectionUrl, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) { // mongo connection error
            console.log(err); // log error
            callback(-1); // return failure indicator in callback
        } else {
            numberOfPollOptions = Object.keys(pollBody).length - 2; // get number of poll options from the JSON object
            var pollOptions = []; // new array for storing all poll options
            for (var i = 1; i <= numberOfPollOptions; i++) { // populate pollOptions
                pollOptions.push(pollBody["option" + i]);
            }
            var newPollId = getRandomId(1000000, 9999999); // generate a random 7-digit poll ID
            var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
            var newPoll = { // Object to represent the new poll
                owner: username, // Owner of the poll
                pollId: newPollId, // the poll's randomly generated ID
                pollPrompt: pollBody.pollPrompt, // the poll's prompt
                pollOptions: pollOptions, // array containing all poll options, indexed
                createdDate: new Date() // create new Date object for new poll's creation date
            };
            dbObject.collection("poll").insertOne(newPoll, function (err, res) { // Insert function
                if (err) { //error inserting new poll
                    db.close();
                    console.log(err); // log error
                    callback(-1); // callback with failed registration
                } else { // successful 
                    console.log("New poll has been inserted!"); // Log success message
                    db.close(); // Close connection to database
                    callback(newPollId); // callback with successful register   
                }
            });
        }
    });
}

var getPollById = module.exports.getPollById = function (mongoClient, mongoConnectionUrl, pollId, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) { // mongo connection error
            console.log(err); // log error
            callback(-1); // return failure indicator in callback
        } else {
            var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
            var query = {
                pollId: parseInt(pollId) // query based on pollId (parse string to int)
            }
            dbObject.collection("poll").find(query).toArray(function (err, result) { // get results as an array
                db.close(); // close DB connection
                if (err) { // if query error
                    console.log(err); // log error
                    callback(-1); // return failure indicator
                } else { // if success
                    callback(result); // callback with result
                }
            });
        }
    });
}

// A function to get the 20 most recent polls in the database
module.exports.getRecentPolls = function (mongoClient, mongoConnectionUrl, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) { // mongo connection error
            console.log(err); // log error
            callback(-1); // return failure indicator in callback
        } else {
            var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
            // get a max of 20 most recent poll data as an array
            dbObject.collection("poll").find().limit(20).sort({
                createdDate: -1
            }).toArray(function (err, result) {
                db.close(); // close DB connection
                if (err) { // if query error
                    console.log(err); // log error
                    callback(-1); // return failure indicator
                } else { // if success
                    callback(result); // callback with result
                }
            });
        }
    });
}

module.exports.getPollResults = function (mongoClient, mongoConnectionUrl, pollId, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) { // mongo connection error
            console.log(err); // log error
            callback(-1, -1); // return failure indicator in callback
        } else {
            var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
            var query = { // A query to identify if the user has voted in the poll
                pollId: pollId, // query based on pollId (parse string to int)
            }
            dbObject.collection("pollVote").find(query).toArray(function (err, allPollVotes) { // get results as an array
                db.close(); // close DB connection
                if (err) { // if query error or user has not voted in poll
                    callback(-1, -1); // return failure indicator
                } else { // if user has voted in poll
                    getPollById(mongoClient, mongoConnectionUrl, pollId, function (resultOfPollQuery) {
                        if (resultOfPollQuery != -1) {
                            callback(allPollVotes, resultOfPollQuery);
                        } else {
                            callback(-1, -1);
                        }
                    });
                }
            });
        }
    });
}

module.exports.voteInPoll = function (mongoClient, mongoConnectionUrl, pollId, voteChoice, username, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) { // mongo connection error
            console.log(err); // log error
            callback(-1); // return failure indicator in callback
        } else {
            var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
            var newVoteInsert = { // object for the new vote to be inserted
                username: username,
                pollId: pollId,
                voteChoice: voteChoice,
                voteDate: new Date()
            } // new vote object to insert
            dbObject.collection("pollVote").insertOne(newVoteInsert, function (err, res) {
                if (err) //insertion error
                    callback(-1); //callback with failure indicator
                else
                    callback(1);
            });
        }
    });
}

module.exports.searchPolls = function (mongoClient, mongoConnectionUrl, searchTerm, callback) {
    mongoClient.connect(mongoConnectionUrl, function (err, db) { // Connect to MongoDB
        if (err) { // mongo connection error
            console.log(err); // log error
            callback(-1); // return failure indicator in callback
        } else {
            var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
            var searchQuery = {pollPrompt:{'$regex' : searchTerm, '$options' : 'i'}}; // regex for search term inclusion (ignore case)
            dbObject.collection("poll").find(searchQuery).toArray(function (err, results) { // get results as an array
                db.close(); // close DB connection
                if (err){ // if query error
                    console.log(err); // log server error
                    callback(-1); // return failure indicator
                }
                else // results found successfully
                    callback(results); // return the search results
            });
        }
    });
}

// Generates a random number in a given range
function getRandomId(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}