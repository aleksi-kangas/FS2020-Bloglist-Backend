const mongoose = require('mongoose')
const supertest = require('supertest')
const app = require('../app')
const helper = require('./test_helper')

const api = supertest(app)

const Blog = require('../models/blog')
const User = require('../models/user')

// Helper method for token creation
const getToken = async () => {
    const res = await api
        .post('/api/login')
        .send({
            username: helper.initialUser.username,
            password:helper.initialUser.password
        })
    return res.body.token
}

beforeEach(async () => {
    await User.deleteMany({})
    await Blog.deleteMany({})

    await api
        .post('/api/users')
        .send(helper.initialUser)


    const usersInDb = await helper.usersInDb()
    const user = usersInDb[0]

    const blogs = helper.initialBlogs
    blogs.forEach(blog => blog.user = user.id)

    const blogObjects = blogs.map(blog => new Blog(blog))
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
            .set('authorization', 'Bearer ' + await getToken())
            .send(blog)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const blogsInDb = await helper.blogsInDb()
        expect(blogsInDb.length).toBe(helper.initialBlogs.length + 1)

        const authors = blogsInDb.map(blog => blog.author)
        expect(authors).toContain(blog.author)
    })

    test('fails with valid data when missing authorization header', async () => {
        const blog = {
            title: 'title',
            author: 'author',
            url: 'url',
            likes: 1
        }
        await api
            .post('/api/blogs')
            .send(blog)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        const blogsInDb = await helper.blogsInDb()
        expect(blogsInDb.length).toBe(helper.initialBlogs.length)
    })

    test('fails with valid data when invalid authorization header', async () => {
        const blog = {
            title: 'title',
            author: 'author',
            url: 'url',
            likes: 1
        }
        await api
            .post('/api/blogs')
            .set('authorization', 'Bearer ' + 'invalid_authorization_header')
            .send(blog)
            .expect(401)
            .expect('Content-Type', /application\/json/)

        const blogsInDb = await helper.blogsInDb()
        expect(blogsInDb.length).toBe(helper.initialBlogs.length)
    })

    test('likes property missing defaults to 0', async () => {
        const blog = {
            title: 'title',
            author: 'author',
            url: 'url'
        }

        await api
            .post('/api/blogs')
            .set('authorization', 'Bearer ' + await getToken())
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
            .set('authorization', 'Bearer ' + await getToken())
            .send(blog)
            .expect(400)

        const blogsInDb = await helper.blogsInDb()
        expect(blogsInDb.length).toBe(helper.initialBlogs.length)
    })
})

describe('deleting a blog', () => {
    test('succeeds with a valid id and authorization header', async () => {
        const blogsInDb = await helper.blogsInDb()

        await api
            .delete(`/api/blogs/${blogsInDb[0].id}`)
            .set('authorization', 'Bearer ' + await getToken())
            .expect(204)

        const blogsAtEndInDb = await helper.blogsInDb()
        expect(blogsAtEndInDb.length).toBe(blogsInDb.length - 1)

        const titles = blogsAtEndInDb.map(blog => blog.title)
        expect(titles).not.toContain(blogsInDb[0].title)
    })

    test('fails with invalid id', async () => {
        const id = await helper.nonExistingId()

        await api
            .delete(`/api/blogs/${id}`)
            .set('authorization', 'Bearer ' + await getToken())
            .expect(404)

        const blogsAtEndInDb = await helper.blogsInDb()
        expect(blogsAtEndInDb.length).toBe(helper.initialBlogs.length)
    })

    test('fails with invalid authorization header', async () => {
        const blogsInDb = await helper.blogsInDb()

        await api
            .delete(`/api/blogs/${blogsInDb[0].id}`)
            .set('authorization', 'Bearer ' + 'invalid_authorization_header')
            .expect(401)

        const blogsAtEndInDb = await helper.blogsInDb()
        expect(blogsAtEndInDb.length).toBe(blogsInDb.length)
    })

    test('fails with missing authorization header', async () => {
        const blogsInDb = await helper.blogsInDb()

        await api
            .delete(`/api/blogs/${blogsInDb[0].id}`)
            .expect(401)

        const blogsAtEndInDb = await helper.blogsInDb()
        expect(blogsAtEndInDb.length).toBe(blogsInDb.length)
    })
})

describe('updating likes of a blog', () => {
    test('succeeds with valid id and data', async () => {
        const blogsInDb = await helper.blogsInDb()
        const blogToUpdate = blogsInDb[0]
        const blog = {
            likes: 99
        }

        await api
            .put(`/api/blogs/${blogToUpdate.id}`)
            .send(blog)
            .expect(200)

        const blogsAtEndInDb = await helper.blogsInDb()
        const updatedBlog = await blogsAtEndInDb.find(
            blog => blog.title === blogToUpdate.title)
        expect(updatedBlog.likes).toBe(99)
    })
    test('fails with invalid id', async () => {
        const blogsInDb = await helper.blogsInDb()
        const id = await helper.nonExistingId()
        const blog = {
            likes: 99
        }

        await api
            .put(`/api/blogs/${id}`)
            .send(blog)
            .expect(400)

        const blogsAtEndInDb = await helper.blogsInDb()
        expect(blogsInDb).toEqual(blogsAtEndInDb)
    })
})

describe('creating users', () => {
    test('creating a user succeeds with valid username and password', async () => {
        const usersInDb = await helper.usersInDb()

        const newUser = {
            username: "new_user",
            name: "New User",
            password: "newuserpassword"
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(201)
            .expect('Content-Type', /application\/json/)

        const usersAtEndInDb = await helper.usersInDb();
        expect(usersAtEndInDb.length).toBe(usersInDb.length + 1)

        const usernames = usersAtEndInDb.map(user => user.username)
        expect(usernames).toContainEqual(newUser.username)
    })
    test('creating a user fails if username is already taken', async () => {
        const usersInDb = await helper.usersInDb()

        const result = await api
            .post('/api/users')
            .send(helper.initialUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('`username` to be unique')

        const usersAtEndInDb = await helper.usersInDb()
        expect(usersAtEndInDb.length).toBe(usersInDb.length)
    })
    test('creating a user fails with a username shorter than 3 characters', async () => {
        const usersInDb = await helper.usersInDb()
        const newUser = {
            username: "us",
            name: "User",
            password: "password"
        }

        await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        const usersAtEndInDb = await helper.usersInDb();
        expect(usersAtEndInDb.length).toBe(usersInDb.length)
    })
    test('creating a user fails with a password shorter than 3 characters', async () => {
        const usersInDb = await helper.usersInDb()
        const newUser = {
            username: 'new_user',
            name: 'New User',
            password: 'pw'
        }

        const result = await api
            .post('/api/users')
            .send(newUser)
            .expect(400)
            .expect('Content-Type', /application\/json/)

        expect(result.body.error).toContain('password')

        const usersAtEndInDb = await helper.usersInDb()
        expect(usersAtEndInDb.length).toBe(usersInDb.length)
    })
})

afterAll(() => {
    mongoose.connection.close()
})