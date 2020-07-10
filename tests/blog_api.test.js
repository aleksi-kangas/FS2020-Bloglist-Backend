const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')

const api = supertest(app)

const Blog = require('../models/blog')

beforeEach(async () => {
    // Initialize the test database
    await Blog.deleteMany({})
    const blogObjects = helper.initialBlogs.map(blog => new Blog(blog))
    await Promise.all(blogObjects.map(blog => blog.save()))
})


describe('get all blogs', () => {
    test('blogs are returned in JSON format', async () => {
        await api
            .get('/api/blogs')
            .expect(200)
            .expect('Content-Type', /application\/json/)
    })
    test('correct amount of blogs are returned', async () => {
        const res = await api.get('/api/blogs')
        expect(res.body.length).toBe(helper.initialBlogs.length)
    })
    test('unique identifier field is named id', async () => {
        const res = await api.get('/api/blogs')
        res.body.forEach(blog => {
            expect(blog.id).toBeDefined()
        })
    })
})

describe('adding a new blog', () => {
    test('successful with valid data', async () => {
        const blog = {
            title: 'title',
            author: 'author',
            url: 'url',
            likes: 1
        }

        await api
            .post('/api/blogs')
            .send(blog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsInDb = await helper.blogsInDb()
        expect(blogsInDb.length).toBe(helper.initialBlogs.length + 1)

        const authors = blogsInDb.map(blog => blog.author)
        expect(authors).toContain(blog.author)
    })
    test('likes property missing defaults to 0', async () => {
        const blog = {
            title: 'title',
            author: 'author',
            url: 'url'
        }

        await api
            .post('/api/blogs')
            .send(blog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsInDb = await helper.blogsInDb()
        const addedBlog = blogsInDb.find(blog => blog.title === 'title')

        expect(addedBlog.likes).toBe(0)
    })
    test('title and url missing equals bad request', async () => {
        const blog = {
            author: 'author',
            likes: 1
        }

        await api
            .post('/api/blogs')
            .send(blog)
            .expect(400)

        const blogsInDb = await helper.blogsInDb()
        expect(blogsInDb.length).toBe(helper.initialBlogs.length)
    })
})

afterAll(() => {
    mongoose.connection.close()
})