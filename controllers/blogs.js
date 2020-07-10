const blogsRouter = require('express').Router()
const Blog = require('../models/blog')

blogsRouter.get('/', async (req, res) => {
    const blogs = await Blog.find({})
    await res.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (req, res) => {
    const blog = new Blog({
        url: req.body.url,
        title: req.body.title,
        author: req.body.author,
        likes: req.body.likes || 0
    })
    try {
        const savedBlog = await blog.save()
        await res.status(201).json(savedBlog.toJSON)
    } catch (exception) {
        res.status(400).end()
    }
})

module.exports = blogsRouter