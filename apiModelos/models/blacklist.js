const mongoose = require('mongoose')

var blacklistSchema = new mongoose.Schema({
    token: {type: String, required: true},
    dataExp: {type: Date, required: true}
  });

module.exports = mongoose.model('blacklist', blacklistSchema)