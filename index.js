const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const mustacheExpress = require('mustache-express')
const path = require('path')
const fs = require('fs').promises
const jwt = require('jsonwebtoken')

const PORT = process.env.PORT || 3030
const PASSWORD = process.env.PASSWORD
const SECRET = process.env.SECRET

const LOGIN_PAGE = '/login.html'
const LOGIN_VIEW = 'login.html'

const BOOKS_PAGE = '/books.html'
const BOOKS_VIEW = 'books.html'

const cssFolder = path.join(__dirname, 'css')
const viewsFolder = path.join(__dirname, 'views')
const booksFolder = path.join(__dirname, 'books')

const getLoginPage = (_, res) => {
  res.render(LOGIN_VIEW)
}

const postLoginPage = async (req, res) => {
  if (req.body.password !== PASSWORD) {
    res.render(LOGIN_VIEW, { loginFailed: true })
    return
  }
  const token = mintToken()
  res
    .cookie('token', token)
    .redirect(BOOKS_PAGE)
}

const getBooksPage = async (_, res) => {
  const fileNames = await fs.readdir(booksFolder)
  const books = fileNames
    .filter(fileName => fileName.endsWith('.pdf'))
    .map(fileName => ({ fileName, href: `/books/${fileName}` }))
  res.render(BOOKS_VIEW, { books })
}

const mintToken = () => {
  const payload = {}
  const options = {
    issuer: 'bookshelf-jt',
    expiresIn: '1y'
  }
  return jwt.sign(payload, SECRET, options)
}

const verifyTokenCookie = (req, res, next) => {
  jwt.verify(req.cookies.token, SECRET, err => {
    return err ? res.redirect(LOGIN_PAGE) : next()
  })
}

const main = () => {
  if (!PASSWORD) {
    console.log('PASSWORD not configured - exiting')
    process.exit(1)
  }
  if (!SECRET) {
    console.log('SECRET not configured - exiting')
    process.exit(1)
  }
  const app = express()
  app.use(cookieParser())
  app.use(bodyParser.urlencoded({ extended: false }))
  app.engine('html', mustacheExpress())
  app.set('view engine', 'html')
  app.set('views', viewsFolder)
  app.use('/css', express.static(cssFolder))
  app.get(LOGIN_PAGE, getLoginPage)
  app.post(LOGIN_PAGE, postLoginPage)
  app.use(verifyTokenCookie)
  app.use('/books', express.static(booksFolder))
  app.get(BOOKS_PAGE, getBooksPage)
  app.get('*', getBooksPage)
  app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`))
}

main()
