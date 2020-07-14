const blogsRouter = require('express').Router()
const Blog = require('../models/blog')
const User = require('../models/user')
const jwt = require('jsonwebtoken')

blogsRouter.get('/', async (req, res) => {
    const blogs = await Blog
        .find({})
        .populate({ path: 'user', select: ['username', 'name', 'id']})
    await res.json(blogs.map(blog => blog.toJSON()))
})

blogsRouter.post('/', async (req, res, next) => {
    try {
        const decodedToken = jwt.verify(req.token, process.env.SECRET)
        const user = await User.findById(decodedToken.id)

        const blog = new Blog({
            url: req.body.url,
            title: req.body.title,
            author: req.body.author,
            likes: req.body.likes || 0,
            user: user.id
        })
        const savedBlog = await blog.save()

        // Add blog to the corresponding user
        user.blogs = user.blogs.concat(savedBlog.id)
        await user.save()

        await res
            .status(201)
            .json(savedBlog.toJSON())
    } catch (exception) {
        next(exception)
    }
})

blogsRouter.put('/:id', async (req, res) => {
    const blog = {
        likes: req.body.likes
    }

    try {
        const updatedBlog = await Blog.findByIdAndUpdate(
            req.params.id, blog, {new: true})
        if (updatedBlog) {
            await res
                .json(updatedBlog)
                .status(200)
        } else {
            await res
                .status(400).end()
        }
    } catch (exception) {
        res.status(400).end()
    }
})

blogsRouter.delete('/:id', async (req, res, next) => {
    try {
        const blog = await Blog.findById(req.params.id)

        // Blog not found
        if (!blog) {
            return res.status(404).json({ error: 'blog not found' })
        }

        const decodedToken = jwt.verify(req.token, process.env.SECRET)
        // Verify that deletion is done by the blog's creator
        if (blog.user.toString() === decodedToken.id) {
            await Blog.findByIdAndRemove(req.params.id)
            return res.status(204).end()
        } else {
            return res.status(401).json({ error: 'deletion only possible by the creator' })
        }
    } catch (exception) {
        next(exception)
    }
})

module.exports = blogsRouter