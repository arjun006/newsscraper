var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mongoose = require('mongoose');
var logger = require('morgan');
var cheerio = require('cheerio');

var db = require("./models");

var PORT = 3000;

var app = express();

app.use(logger("dev"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use(express.static("public"));
// Connect to the Mongo DB

if(process.env.NODE_ENV == 'production'){
    mongoose.connect('mongodb://heroku_3t5r3m9q:<dbpassword>@ds151528.mlab.com:51528/heroku_3t5r3m9q', { useNewUrlParser: true });
  }
  else{
    var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/newsscraper";
    mongoose.connect(MONGODB_URI);
  }


app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

var db = mongoose.connection;
db.on('error', function(err) {
    console.log('Mongoose Error: ', err);
  });

  db.once('open', function() {
    console.log('Mongoose connection successful.');
  });

var Comment = require('./models/Note.js');
var Article = require('./models/Article.js');

var router = require('./controllers/Controller');
app.use('/', router);

var port = process.env.PORT || 3000;
app.listen(port, function(){
console.log('Running on port: ' + port);
})
