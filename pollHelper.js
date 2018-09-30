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
            var pollVotes = [] // new array for storing all poll votes
            for (var i = 1; i <= numberOfPollOptions; i++) { // populate pollOptions and pollVotes arrays
                pollOptions.push(pollBody["option" + i]);
                pollVotes.push(0); // all votes initially zero
            }
            var newPollId = getRandomId(1000000, 9999999); // generate a random 7-digit poll ID
            var dbObject = db.db("pollerbear"); // Connect to the PollerBear database
            var newPoll = { // Object to represent the new poll
                owner: username, // Owner of the poll
                pollId: newPollId, // the poll's randomly generated ID
                pollPrompt: pollBody.pollPrompt, // the poll's prompt
                pollOptions: pollOptions, // array containing all poll options, indexed
                pollVotes: pollVotes, // associated array indicated vote numbers for each index
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

module.exports.getPollById = function (mongoClient, mongoConnectionUrl, pollId, callback) {
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

// Generates a random number in a given range
function getRandomId(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}