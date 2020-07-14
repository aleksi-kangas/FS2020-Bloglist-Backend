// From the course material
const tokenExtractor = (req, res, next) => {
    const authHeader = req.get('authorization')
    if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
        req.token = authHeader.substring(7)
    }
    next()
}

const unknownEndpoint = (req, res) => {
    res.status(400).send({ error: 'unknown endpoint' })
}

const errorHandler = (error, req, res, next) => {
    if (error.name === 'ValidationError') {
        return res.status(400).json({ error: error.message })
    } else if (error.name === 'CastError' && error.kind === 'ObjectId') {
        return res.status(400).json({ error: 'malformed id'})
    } else if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ error: 'invalid token' })
    }

    next(error)
}

module.exports = {
    tokenExtractor,
    unknownEndpoint,
    errorHandler
}