var express = require('express');
var router = express.Router();
var path = require('path');
var request = require('request');
var cheerio = require('cheerio');

var Note = require('../models/Note.js');
var Article = require('../models/Article.js');

router.get('/', function(req,res){
    res.redirect('/scrape');
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
    request('http://news.google.com', function(error, response, html){
        var $ = cheerio.load(html);

        var titlesArray=[];

        $('article .inner').each(function(i, element){
            var result = {};
            result.title = $(this).children('header').children('h2').text().trim() + "";
            result.link = 'http://news.google.com' + $(this).children('header').children('h2').children('a').attr("href").trim();
            result.summary = $(this).children('div').text().trim() + "";

            if(result.title !== "" &&  result.summary !== ""){
                if(titlesArray.indexOf(result.title) == -1){
                    titlesArray.push(result.title);
                    Article.count({title: result.title}, function(err, test){
                        if(test==0){
                            var entry = new Article (result)
                            
                        }
                    })
                }
            }

        })
    })
})