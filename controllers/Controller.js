var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');

var Note = require('../models/Note.js');
var Article = require('../models/Article.js');

router.get('/', function(req,res){
    // res.redirect('/scrape');
    res.render('/articles');
});

router.get('/articles', function(req,res){
    Article.find().sort({_id:-1})
    .populate('notes')
    .exec(function(err,doc){
        if(err){
            console.log(err)
        }else{
        var hbsObject = {articles: doc}
        res.render('index', hbsObject);
        }
    });
});

router.get('scrape', function(req,res){
    request('http://www.theonion.com/', function(error, response, html){
        var $ = cheerio.load(html);
        console.log(response);

        var titlesArray=[];

        $('article .inner').each(function(i, element){
            var result = {};
            console.log(result);
            result.title = $(this).children('header').children('h2').text().trim() + "";
            result.link = 'http://www.theonion.com' + $(this).children('header').children('h2').children('a').attr("href").trim();
            result.summary = $(this).children('div').text().trim() + "";

            if(result.title !== "" &&  result.summary !== ""){
                if(titlesArray.indexOf(result.title) == -1){
                    titlesArray.push(result.title);
                    Article.count({title: result.title}, function(err, test){
                        if(test==0){
                            var entry = new Article (result)
                            entry.save(function(err,doc){
                                if(err){
                                    console.log(err);
                                }else{
                                    console.log(doc);
                                }
                            })

                        }else{
                            console.log('scraper working')
                        }
                    })
                }else{
                    console.log('scraper working');
                }
            }else{
                console.log('scraper working');
            }

        });
        res.redirect('/articles');
    });
});

// Post route

router.post('add/note/id:', function(req,res){
    var articleID = req.params.id;
    var noteAuthor = req.params.name;
    var noteBody = req.body.comment

    var result = {
        author: noteAuthor,
        content: noteBody
    };

    var entry = new Note (result);

    entry.save(function(err, doc){
        if(err){
            console.log(err)
        }else{
            Article.findOneAndUpdate(
                {'_id': articleID},
                {$push:{'notes':doc._id}},
                {new:true}
                )
                .exec(function(err,doc){
                    if(err){
                        console.log(err);
                    }else{
                        res.sendStatus(200);
                    }
                });
        }
    });
});

router.post('delete/note/id:', function(req, res){
    var noteID = req.params.id;
    Note.findByIdAndDelete(commentId, function(err, todo){
        if(err){
            console.log(err);
        }else{
            console.log("successfully removed note" + res.sendStatus(2000));
        }
    });
});

module.exports=router;