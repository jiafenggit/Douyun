const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    password: {type: String, select: false},
    token: String,
    roles: [String],
    name: String,
    gender: String,
    mobile: String,
    num: String,
    institution: {_id: Schema.ObjectId, name: String}
});

userSchema.index({username:1}, {unique:true});

module.exports = mongoose.model('User', userSchema);
