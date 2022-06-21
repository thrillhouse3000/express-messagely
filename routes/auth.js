const express = require('express');
const router = new express.Router();
const jwt = require('jsonwebtoken')
const {SECRET_KEY} = require('../config')
const ExpressError = require('../expressError');
const User = require('../models/user');

router.post('/login', async (req, res, next) => {
    try{
        const {username, password} = req.body;
        if (!username || !password) {
            throw new ExpressError('Missing required inputs', 400)
        }

        if(await User.authenticate(username, password)) {
            const token = jwt.sign({username}, SECRET_KEY);
            return res.json({message:`Logged in`, token});
        } else {
            throw new ExpressError('Invalid username/password', 400);
        }
    } catch(err) {
        return next(err)
    }
})

router.post('/register', async (req, res, next) => {
    try{
        const {username, password, first_name, last_name, phone} = req.body;
        if(!username || !password || !first_name || !last_name || !phone) {
            throw new ExpressError('Missing required inputs', 400);
        }
        await User.register({username, password, first_name, last_name, phone});
        const token = jwt.sign({username}, SECRET_KEY);
        return res.json({message:`Logged in`, token});
    } catch(err) {
        if(err.code === '23505') {
            return next(new ExpressError('Username already in use', 400));
        }
        return next(err)
    }
})

module.exports = router;

