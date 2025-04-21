const mongoose = require('mongoose');

const UsersComplete = new mongoose.Schema({},{strict:false });

module.exports = mongoose.model(
    'UsersComplete',
    UsersComplete,
    'UsersComplete',
);