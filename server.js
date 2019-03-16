var express = require("express");
var exphbs = require("express-handlebars");
var method = require("method-override");
var body = require("body-parser");
var mongoose = require('mongoose');
var axios = require("axios");
var logger = require('morgan');
var cheerio = require('cheerio');
var request = require('request');



var app = express();

app.use(body.urlencoded({extended: false}));
app.use(method("_method"));
app.use(logger("dev"));
app.use(express.json());
app.use(express.static("public"));
app.engine('handlebars', exphbs({defaultLayout: "main"}));
app.set('view engine', 'handlebars');

var Note = require('./models/Note.js');
var Article = require('./models/Article.js');
var databaseUrl="mongodb://localhost/newsscraper";

// Connect to the Mongo DB
if(process.env.MONGODB_URI){
    mongoose.connect(process.env.MONGODB_URI)
  }
  else{
    mongoose.connect(databaseUrl);
  }

mongoose.Promise=Promise;
var db = mongoose.connection;
db.on('error', function(err) {
    console.log('Mongoose Error: ', err);
  });

  db.once('open', function() {
    console.log('Mongoose connection successful.');
  });

var port = process.env.PORT || 3000;
app.listen(port, function(){
console.log('Running on port: ' + port);
})

// Routes
app.get('/', function(req,res){
    Article.find({}, null, {sort: {created: -1}}, function(err, data) {
        res.render("index", {articles: data});
	});
});
// Get Scrape Route
app.get('/scrape', function(req, res){
    request('https://www.nytimes.com/section/business', function(error,response,html){
        if (!error && response.statusCode == 200)
        var $ = cheerio.load(html);
        console.log(html);
        var result={};

        $('p').each(function(i,element){
            var link = $(element).text();
            var heading = $(element).text();
            var summary = $(element).text();

            result.summary = summary;
            result.heading = heading;
            result.link = link;

            var entry = new Article(result);
            Article.find({heading: result.heading}, function(err,data){
                if(data.length===0){
                    entry.save(function(err,data){
                        if(err) throw(err);
                    });
                }
            });
        });
        res.redirect('/');
        console.log(result);
    });
});
// Get Saved Route
app.get('/saved', function(req,res){
    Article.find({isSaved: true}, null,{sort:{created:-1}},function(err, data){
            res.render('saved',{saved:data});
            console.log(data);
        
    });
});

app.get('/:id', function(req,res){
    Article.findById(req.params.id, function(err,data){
        if (err) throw (err);
        res.json(data);
    });
});

app.post("/save/:id", function(req, res) {
	Article.findById(req.params.id, function(err, data) {
		if (data.isSaved) {
			Article.findByIdAndUpdate(req.params.id, {$set: {isSaved: false, status: "Save Article"}}, {new: true}, function(err, data) {
				res.redirect("/");
			});
		}
		else {
			Article.findByIdAndUpdate(req.params.id, {$set: {isSaved: true, status: "Saved"}}, {new: true}, function(err, data) {
				res.redirect("/saved");
			});
		}
	});
});

app.post('note/id:', function(err,data){
    var note =  new Note(req.body)
    note.save(function(err,data){
        if(err)throw err;
        Article.findByIdAndUpdate(req.params.id, {$set:{'note':doc._id}}, {new:true}, function(err,newdoc){
            if(err) throw err;
            else{
                res.send(newdoc);
            }
        });
    });
});

app.get('note/id:', function(req,res){  
    var id = req.params.id;
    Article.findById(id).populate('note').exec(function(err,data){
        res.send(data.note);
    });
});