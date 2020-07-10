const listHelper = require('../utils/list_helper')
const helper = require('./test_helper')

test('dummy returns one', () => {
    const blogs = []

    const result = listHelper.dummy(blogs)
    expect(result).toBe(1)
})

describe('total likes', () => {

    test('of empty list is zero', () => {
        const blogs = []
        const result = listHelper.totalLikes(blogs)
        expect(result).toBe(0)
    })

    test('when list has only one blog equals the likes of that', () => {
        const result = listHelper.totalLikes([helper.initialBlogs[0]])
        expect(result).toBe(7)
    })

    test('of a bigger list is calculated right', () => {
        const result = listHelper.totalLikes(helper.initialBlogs)
        expect(result).toBe(36)
    })
})

describe('favorite blog', () => {
    test('is identified correctly', () => {
        const result = listHelper.favoriteBlog(helper.initialBlogs)
        const expectedBlog = {
            title: 'Canonical string reduction',
            author: 'Edsger W. Dijkstra',
            url: 'http://www.cs.utexas.edu/~EWD/transcriptions/EWD08xx/EWD808.html',
            likes: 12
        }
        expect(result).toEqual(expectedBlog)
    })
})

describe('author', () => {
    test('with most blogs is identified correctly', () => {
        const result = listHelper.mostBlogs(helper.initialBlogs)
        const expectedAuthor = {
            author: 'Robert C. Martin',
            blogs: 3
        }
        expect(result).toEqual(expectedAuthor)
    })

    test('with most likes is identified correctly', () => {
        const result = listHelper.mostLikes(helper.initialBlogs)
        const expectedAuthor = {
            author: 'Edsger W. Dijkstra',
            likes: 17
        }
        expect(result).toEqual(expectedAuthor)
    })
})