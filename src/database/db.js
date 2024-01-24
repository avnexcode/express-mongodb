const mongoose = require('mongoose')
mongoose.connect('mongodb://127.0.0.1:27017/users-manager')
  .then(() => console.log('Database Connected! From DB')).catch(err => console.log(err));