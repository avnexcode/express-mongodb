const express = require('express')
const app = express()
const chalk = require('chalk')
const expressLayouts = require('express-ejs-layouts')
const morgan = require('morgan')
const session = require('express-session')
const cookieParser = require('cookie-parser')
const flash = require('connect-flash')
const { User } = require('./src/models/User')
const { check, validationResult } = require('express-validator')
const PORT = 3000
const methodOverride = require('method-override')
app.use(methodOverride('_method'))
app.use(cookieParser('secret'))
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true,
    cookie: { maxAge: 6000 }
}))
app.set('view engine', 'ejs')
app.use(expressLayouts)
app.use(express.static('public'))
app.use(morgan('dev'))
app.use(express.urlencoded())
app.use(flash())

require('./src/database/db')


app.get('/', (req, res, next) => {
    console.log('Middleware')
    next()
})

app.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).render('index', {
            layout: 'layouts/main-layout',
            title: 'Home',
            users
        })
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal Server Error');
    }
})

app.get('/dashboard', async (req, res) => {
    try {
        const users = await User.find()
        res.status(200).render('dashboard', {
            layout: 'layouts/main-layout',
            title: 'Dashboard',
            users,
            flash: req.flash('msg'),
        })
    } catch (err) {
        res.status(500).render('500', {
            layout: 'layouts/main-layout',
            title: '500 - Internal Server Error'
        })
    }
})

app.get('/dashboard/detail', async (req, res) => {
    const user = await User.findOne({ _id: req.query.id })
    res.status(200).render('detail', {
        layout: 'layouts/main-layout',
        title: 'Detail',
        user

    })
})

app.get('/dashboard/create', (req, res) => {
    res.status(200).render('create', {
        layout: 'layouts/main-layout',
        title: 'Tambah Pengguna'
    })
})

app.post('/dashboard/create', [
    check('name')
        .notEmpty().withMessage('Nama tidak boleh kosong.'),
    check('phone')
        .notEmpty().withMessage('Nomor HP tidak boleh kosong.')
        .isMobilePhone('id-ID').withMessage('Nomor yang anda masukkan tidak sesuai.')
        .custom(async value => {
            const user = await User.findOne({ phone: value })
            if (user) {
                if (user.phone) {
                    throw new Error('Nomor HP sudah terdaftar.')
                }
                return true
            }
        }),
    check('email')
        .notEmpty().withMessage('Email tidak boleh kosong.')
        .isEmail().withMessage('Email yang anda masukkan tidak sesuai.')
        .custom(async value => {
            const user = await User.findOne({ email: value })
            if (user) {
                if (user.email) {
                    throw new Error('Email sudah terdaftar.')
                }
                return true
            }
        }),
], async (req, res) => {
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
        res.status(200).render('create', {
            layout: 'layouts/main-layout',
            title: 'Tambah Pengguna',
            errors: errors.array()
        })
    } else {
        try {
            await User.insertMany([{
                name: req.body.name.toUpperCase(),
                phone: req.body.phone,
                email: req.body.email
            }])
            req.flash('msg', 'Data Berhasil Ditambahkan')
            res.status(200).redirect('/dashboard')
        } catch (err) {
            res.status(500).render('500', {
                layout: 'layouts/main-layout',
                title: '500 - Internal Server Error'
            })
        }
    }
})

app.delete('/dashboard', async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.body.id })
        if (user) {
            if (user._id) {
                await User.deleteOne({ _id: user._id })
                res.redirect('/dashboard')
            }
        } else {
            res.redirect('/dashboard')
        }
    } catch (err) {
        res.status(500).render('500', {
            layout: 'layouts/main-layout',
            title: '500 - Internal Server Error'
        })
    }
})

app.get('/dashboard/update/', async (req, res) => {
    const user = await User.findOne({ _id: req.query.id })
    res.status(200).render('update', {
        layout: "layouts/main-layout",
        title: 'Update',
        user
    })
})

app.put('/dashboard', [
    check('name')
        .notEmpty().withMessage('Nama tidak boleh kosong.'),
    check('email')
        .notEmpty().withMessage('Email tidak boleh kosong.')
        .isEmail().withMessage('Email yang anda masukkan tidak sesuai.')
        .custom(async (value, { req }) => {
            const user = await User.findOne({ email: req.body.email })
            if (user) {
                if (value !== req.body.oldEmail && value === user.email) {
                    throw new Error('Email sudah terdaftar.')
                }
                return true
            }
        }),
    check('phone')
        .notEmpty().withMessage('Nomor HP tidak boleh kosong.')
        .isMobilePhone('id-ID').withMessage('Nomor HP sudah terdaftar.')
        .custom(async (value, { req }) => {
            const user = await User.findOne({ phone: req.body.phone })
            if (user) {
                if (value !== req.body.oldPhone && value === user.phone) {
                    throw new Error('Nomor Hp sudah terdaftar.')
                }
                return true
            }
        })
], async (req, res) => {
    const errors = validationResult(req)
    const user = await User.findOne({ _id: req.body.id })
    if (!errors.isEmpty()) {
        res.status(200).render('update', {
            layout: 'layouts/main-layout',
            title: 'Update',
            errors: errors.array(),
            user
        })
    } else {
        try {
            await User.updateOne({ _id: req.body.id }, {
                $set: {
                    name: req.body.name,
                    phone: req.body.phone,
                    email: req.body.email,
                }
            })
            req.flash('msg', `Data ${user.name} sudah berhasil di update.`)
            res.status(200).redirect('/dashboard')
        } catch (err) {
            res.status(500).render('500', {
                layout: 'layouts/main-layout',
                title: '500 - Internal Server Error'
            })
        }
    }
})

app.use('/', (req, res) => {
    res.status(404).render('404', {
        layout: 'layouts/main-layout',
        title: '404'
    })
})

app.listen(PORT, () => console.log(chalk.blue(`Server listen on port ${chalk.underline('http://localhost:' + PORT)}`)))