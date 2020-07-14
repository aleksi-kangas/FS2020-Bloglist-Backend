const bcrypt = require('bcrypt')
const usersRouter = require('express').Router()
const User = require('../models/user')

usersRouter.get('/', async (req, res) => {
    const users = await User
        .find({})
        .populate({ path: 'blogs', select: ['url', 'title', 'author', 'id'] })
    await res.json(users.map(user => user.toJSON()))
})

usersRouter.post('/', async (req, res, next) => {
    // Password required with minimum length 3
    if (req.body.password.length < 3) {
        return res.status(400).json({ error: 'password must be at least 3 characters long'})
    }

    const rounds = 10
    const passwordHash = await bcrypt.hash(req.body.password, rounds)

    const user = new User({
        username: req.body.username,
        name: req.body.name,
        passwordHash
    })

    try {
        const savedUser = await user.save()
        await res
            .status(201)
            .json(savedUser)
    } catch (exception) {
        next(exception)
    }
})

module.exports = usersRouter