var express = require("express");
var exphbs = require("express-handlebars");
var bodyParser = require("body-parser");
var mongoose = require('mongoose');
var logger = require('morgan');
var cheerio = require('cheerio');
var request = require('request');



var app = express();
app.use(logger("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("public"));
app.engine('handlebars', exphbs({defaultLayout: "main"}));
app.set('view engine', 'handlebars');

var Note = require('./models/Note.js');
var Article = require('./models/Article.js');
var databaseUrl="mongodb://localhost/newsscraper"

// Connect to the Mongo DB
if(process.env.NODE_ENV == 'production'){
    mongoose.connect('mongodb://heroku_3t5r3m9q:<dbpassword>@ds151528.mlab.com:51528/heroku_3t5r3m9q', { useNewUrlParser: true });
  }
  else{
    var MONGODB_URI = process.env.MONGODB_URI || databaseUrl;
    mongoose.connect(MONGODB_URI);
  }


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
    res.redirect('/articles');
});

app.get('/scrape', function(req,res){
    request("https://nytimes.com", function(error, response, html){
        var $=cheerio.load(html);
        var result = {};
        $('div .story-body').each(function(i, element){
            var title = $(element).find('h2 .headline').text().trim();
            var body = $(element).find('p .summary').text();
            var link = $(element).find('a').attr('href')
            
            var entry = new Article(result)
            Article.find({title:result.title},function(err,data){
                if(data.length===0){
                    entry.save(function(err,data){
                        if(err) throw(err);
                    });
                }
            });
        });

    });
});

app.get('/saved', function(req,res){
    Article.find({isSaved: true}, null,{sort:{created:-1}},function(err, data){
        if(data.length===0){
            res.render('placeholder',{message:"There are no saved articles"});
        }else{
            res.render('saved',{saved:data});
        }
    });
});

app.get('/:id', function(req,res){
    Article.findById(req.params.id, function(err,data){

    });
});

app.post("/save/:id", function(req, res) {
	Article.findById(req.params.id, function(err, data) {
		if (data.issaved) {
			Article.findByIdAndUpdate(req.params.id, {$set: {issaved: false, status: "Save Article"}}, {new: true}, function(err, data) {
				res.redirect("/");
			});
		}
		else {
			Article.findByIdAndUpdate(req.params.id, {$set: {issaved: true, status: "Saved"}}, {new: true}, function(err, data) {
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