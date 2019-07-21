const express = require('express');
const path = require('path')
const bodyParser = require('body-parser')
const mongoose = require('mongoose')
require('dotenv').config();
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Express Stuff
const app = express();
app.set('view engine', 'html');
app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())

app.use('/static', express.static(__dirname + '/public'));

// Database 

const dburi = process.env.MONGO_URI

const connectDB = async () => {
    try {
        await mongoose.connect(dburi, {
            useNewUrlParser: true,
            useCreateIndex: true
        });
        console.log('Database Connected')
    }catch(err) {
        console.error(err.message);
        process.exit(1);
    }
}

connectDB();

const userSchema = new mongoose.Schema({
    email: {type: String, required: true, unique: true},
    authToken: {type: String, required: true, unique:true},
    isAuthenticated: {type: Boolean, required: true}

});


const User = mongoose.model('User', userSchema);

// Nodemailer Stuff
const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    auth: {
        user: 'bonnie.oconnell@ethereal.email',
        pass: 'tshJExnTUfCE6s4cvk'
    }
});


// Routes

app.get('/', (req,res) => {
    res.sendFile(path.join(__dirname + '/public/index.html'));
})

app.post('/register-email', (req,res) => {
    console.log('user email: ', req.body.email);

    //generate authentication token
    const seed = crypto.randomBytes(20);
    const authToken = crypto.createHash('sha1').update(seed + req.body.email).digest('hex');

    const newUser = new User({
        email: req.body.email,
        authToken: authToken,
        isAuthenticated: false
    });

    newUser.save((err, newUser) => {
        if (err) {
            return console.error(err);
        }
        console.dir(newUser);
        const authenticationURL = 'http://localhost:8080/verify-email?token=' + newUser.authToken;
        transporter.sendMail({
            from: '"Test Account" <bonnie.oconnell@ethereal.email>',
            to: newUser.email,
            subject: 'Please Confirm your email address',
            html:  '<a target=_blank href=\"' + authenticationURL + '\">Confirm your email</a>'
        });
    });

    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.get('/verify-email', (req,res) => {
    console.log('verify-email token: ',req.query.token);

    User.findOne({ authToken: req.query.token }, (err, User) => {
        if (err) { return console.error(err); }
        console.dir(User);

        User.isAuthenticated = true;
        User.save(function (err) {
            if (err) return console.error(err);
            console.log('succesfully updated user');
            console.log(user);

            res.send(User);
        });
    });

    res.sendFile(path.join(__dirname + '/public/index.html'));
});

app.listen(process.env.POST || 8080, () => console.log(`Listening on port ${process.env.PORT || 8080}!`));