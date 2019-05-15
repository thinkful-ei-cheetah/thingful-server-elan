const knex = require('knex')
const jwt = require('jsonwebtoken')
const app = require('../src/app')
const helpers = require('./test-helpers')

describe(`Auth endpoints`, () => {
  let db

  const { testUsers } = helpers.makeThingsFixtures()
  const testUser = testUsers[0]

  before('make knex instance', () => {
    db = knex({
      client: 'pg',
      connection: process.env.TEST_DB_URL
    })
    app.set('db', db)
  })

  after('disconnect from db', () => db.destroy())

  before('cleanup', () => helpers.cleanTables(db))

  afterEach('cleanup', () => helpers.cleanTables(db))

  describe(`POST /api/auth/login`, () => {
    beforeEach(`insert users`, () => {
      helpers.seedUsers(
        db,
        testUsers
      )
    })
    const requiredFields = ['user_name', 'password']

    requiredFields.forEach(field => {
      const loginAttemptBody = {
        user_name: testUser.user_name,
        password: testUser.password
      }

      it(`responds with 401 required error when '${field}' is missing`, () => {
        delete loginAttemptBody[field]
        return supertest(app)
          .post('/api/auth/login')
          .send(loginAttemptBody)
          .expect(401, {
            error: `Missing '${field}' in request body`
        })
      })
    })

      it(`responds 401 'Incorrect user_name or password'`, () => {
        const userInvalidPass = {
          user_name: testUsers[0].user_name,
          password: 'wrong'
        }
        return supertest(app)
        .post('/api/auth/login')
        .send(userInvalidPass)
        .expect(401, { error: `Incorrect user_name or password` })

      })

      it(`responds 200 and JWT auth token using secret when valid credentials`, () => {
        const userValidCreds = {
          user_name: testUsers[0].user_name,
          password: testUsers[0].password,
        }
        console.log(testUsers[0])
        const expectedToken = jwt.sign(
          { user_id: testUsers[0].id },
          process.env.JWT_SECRET,
          {
            subject: testUsers[0].user_name,
            algorithm: 'HS256',
          }
        )
        return supertest(app)
          .post('/api/auth/login')
          .send(userValidCreds)
          .expect(200, {
            authToken: expectedToken,
          })
      })
    })
})