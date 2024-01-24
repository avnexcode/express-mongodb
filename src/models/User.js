const mongoose = require('mongoose')

mongoose.connect('mongodb://127.0.0.1:27017/users-manager')
    .then(() => console.log('Database Connected! From Model - User')).catch(err => console.log(err));

const User = mongoose.model('user', {
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    }
})

module.exports = {
    User
}