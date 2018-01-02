var express = require("express");
var app = express();

var port = 3000;
var mysql = require("mysql");

var bodyParser = require("body-parser");
var jsonParser = bodyParser.json();

var Promise = require("promise");

var unique = require('array-unique');

var password = require("./password.js");

var pool = mysql.createPool({

    connectionLimit: 100,
    host: '188.166.221.241',
    user: 'root',
    password: password,
    database: 'MinorFinder',
    dateStrings: true,
    debug: false

});

app.set("view engine", "ejs");

app.get("/findminor", function(req, res) {

	res.render("index.ejs");

});

app.post("/app/findminor", jsonParser, function(req, res) {

    var major = req.body.major;
    var courses = req.body.courses;

    if(major == null || courses.length[0] == '') {

	res.send({message: "Empty parameters! Select both major and courses taken."});
	return;

    }


    var coursesInput = req.body.courses;
    var getRequiredClassesQuery = "SELECT courses FROM `courses` c  WHERE c.courses NOT IN (placeholder) AND c."+major.toLowerCase().replace(" ", "_")+" > 0";
    var getAllClassesQuery = "SELECT courses FROM `courses` c";
    var getMinorsQuery = "SELECT cs, mathematics, economics FROM minors";
    var coursesString = '';
    var minors = [];
    var coursesNo = [];
    var coursesRecNo = [];

    for(var i = 0; i < courses.length; i++) {

	if(i == courses.length - 1) {
	    coursesString += "'"+courses[i]+"'";
	} else {
	    coursesString += "'"+courses[i]+"', "
	}

    }

    getRequiredClassesQuery = getRequiredClassesQuery.replace("placeholder", coursesString);

    //Courses they input will be courses they have already taken
    //Then we have to see their major they inputted, pull all of classes required for it and add any unique courses to the already inputted courses (in 1 or 0's).
    //Then we use this compiled list to compare to the minor table.

    pool.getConnection(function(err, con) {

	if(!err) {

	    var allCourses = [];

	    var getRequiredClassesPromise = function () {

		return new Promise(function(resolve, reject) {

		    con.query(getRequiredClassesQuery, function(err, result) {

			if(!err) {

			    var coursesCopy = [];

			    for(var i = 0; i < result.length; i++) {
				coursesCopy.push(result[i].courses);
			    }

			    coursesCopy = unique(coursesCopy);

			    resolve(courses = coursesCopy);

			} else {

			    con.release();

			    throw err;

			}

		    })

		});

	    }

	    var getAllClassesPromise = function () {

		return new Promise(function(resolve, reject) {

		    con.query(getAllClassesQuery, function(err, result) {

			if(!err) {

			    var allCoursesCopy = [];

			    for(var i = 0; i < result.length; i++) {

				allCoursesCopy.push(result[i].courses);

			    }

			    resolve(allCourses = allCoursesCopy);

			} else {

			    con.release();

			    throw err;

			}

		    });

		})

	    }

	    var getMinorsPromise = function () {

		return new Promise(function(resolve, reject) {

		    con.query(getMinorsQuery, function(err, result) {

			if(!err) {

			    var minorsCopy = [];

			    for(var i = 0; i < result.length; i++) {

				minorsCopy.push([result[i].cs, result[i].mathematics, result[i].economics]);

			    }

			    resolve(minors = minorsCopy);

			} else {

			    con.release();

			    throw err;

			}

		    })

		})

	    }

	    getRequiredClassesPromise().then(function() {

		getAllClassesPromise().then(function(){

		    getMinorsPromise().then(function() {

			var primes = [];

			primes.push([3, 5, 7, 11, 13, 17]);
			primes.push([0, 2, 1, 2, 2, 2]);
			primes.push([1, 3, 2, 1, 0, 0]);

			var primesMinor = [];

			primesMinor.push([3, 5, 7, 11, 13, 17]);
			primesMinor.push([3, 0, 0, 0, 0, 0]);
			primesMinor.push([3, 1, 0, 0, 0, 0]);
			primesMinor.push([1, 2, 1, 1, 1, 1]);

			var flag = false;

			for(var i = 0; i < allCourses.length; i++) {

			    flag = false;

			    for(var j = 0; j < coursesInput.length; j++) {

				if(coursesInput[j].toUpperCase() == allCourses[i].toUpperCase()) {

				    flag = true;

				}

			    }

			    if(flag) {

				coursesNo.push(1);

			    } else {

				coursesNo.push(0);

			    }

			}

			coursesRecNo.push([3, 0, 0, 0, 0, 0]);
			coursesRecNo.push([3, 1, 0, 0, 0, 0]);
			coursesRecNo.push([1, 2, 1, 1, 1, 1]);

			for(var i = 0; i < minors[0].length; i++) {

			    for(var j = 0; j < minors.length; j++) {

				if(minors[j][i] > 0 && coursesNo[j] == 1) {

				    for(var k = 0; k < coursesRecNo[0].length; k++) {

					if(minors[j][i] % primes[0][k] == 0) {

					    coursesRecNo[i][k]--;
					    break;

					}

				    }

				}

			    }

			}

			var resultObject = {

			    firstSum: 0,
			    secondSum: 0,
			    thirdSum: 0

			};

			var sum = 0;
			for(var i = 0; i < coursesRecNo[0].length; i++) {
			    if(coursesRecNo[0][i] >= 0)
				sum += coursesRecNo[0][i];
			    if(i == coursesRecNo[0].length - 1) {
				resultObject.firstSum = sum;
			    }
			}

			var sum2 = 0;
			for(var i = 0; i < coursesRecNo[1].length; i++) {
			    if(coursesRecNo[1][i] >= 0)
				sum2 += coursesRecNo[1][i];
			    if(i == coursesRecNo[1].length - 1) {
				resultObject.secondSum = sum2;
			    }
			}

			var sum3 = 0;
			for(var i = 0; i < coursesRecNo[2].length; i++) {
			    if(coursesRecNo[2][i] >= 0)
				sum3 += coursesRecNo[2][i];
			    if(i == coursesRecNo[2].length - 1) {
				resultObject.thirdSum = sum3;
			    }
			}

			res.send(JSON.stringify(resultObject));

			//allCourses (single array of all courses)
			//courses (single array of input courses + major minus duplicates)
			//coursesInput (single array of courses they manually inputted)
			//minors (2d array with cs, math economics and corresponding primes)
			//coursesNo (single array with 1's and 0's of classes they manually entered)
			//coursesRecNo

		    })

		});

	    })


	} else {
 
	    con.release();
	    return err;

	}

    });

});

app.listen(port);