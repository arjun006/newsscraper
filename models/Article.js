var mongoose = require("mongoose");

var Schema = mongoose.Schema;

var ArticleSchema = new Schema({
  heading: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  summary: {
      type:String,
      default:"summary unavailable"
  },
  isSaved: {
      type:Boolean,
      default:false
  },
  note: {
    type: Schema.Types.ObjectId,
    ref: "Note"
  }
});

ArticleSchema.index({heading:'text'});
var Article = mongoose.model("Article", ArticleSchema);

module.exports = Article;
