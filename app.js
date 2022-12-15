var express = require('express');
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
var cookieParser = require('cookie-parser')
const port = process.env.PORT || 3001;
const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://flex_user:w8EUofyBa0h6obRCmlFzlEW6xMjfgDFO@dpg-cead3qmn6mphc8t5t9ng-a/flex_db')

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Flex API",
            version: "1.0.0",
            description: "A simple Express API",
        },
        servers: [
            {
                url: "https://flex-api-45ah.onrender.com"
            },
            {
                url: "http://localhost:3001"
            }
        ],
    },
    apis: ["./routes/*.js"],
};
const specs = swaggerJsDoc(options);

/**
 * @swagger
 * tags:
 *   name: API
 *   description: API for the Flex-App
 */

const app = express();



app.use(express.json());
app.use(cookieParser());
app.use(cors({ credentials: true })); //{ origin: ["https://flex-app.onrender.com", "http://localhost:4200"], credentials: true}

app.get('/', (req, res) => res.json({ message: 'Hello World' }))
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));

const User = sequelize.define('user', {

    // attributes

    name: {

        type: Sequelize.STRING,

        allowNull: false

    },

    password: {

        type: Sequelize.STRING,

        allowNull: false

    }

}, {

    // options

});

const Fav = sequelize.define('favorites', {

    // attributes
    user_id: {
        type: Sequelize.INTEGER,
        allowNull: false
    },

    movie_id: {

        type: Sequelize.INTEGER,

        allowNull: false

    }
}, {

    // options

});

User.sync({ force: true }).then(() => {

});

Fav.sync({ force: true }).then(() => {

});

app.get('/user/:userId', async (req, res) => {

    const userId = req.params.userId
    try {
        const user = await User.findAll({
            where: {
                id: userId
            }
        })
        return res.json({ user });

    } catch (error) {
        console.error(error)
    }

})

app.post('/signup', async (req, res) => {

    const { name, password } = req.body
    try {
        const a = await User.findAll({
            where: {
                name: name,
                password: password
            }
        })
        if (a.length > 0) {
            return res.status(401).send('User already exists');
        }
        const user = await User.create({
            name: name,
            password: password
        })
        res.setHeader('Set-Cookie', 'isLoggedin=true');
        res.cookie('user_id', user.id, { maxAge: 900000 })
        return res.json({ user });
    } catch (error) {
        console.error(error)
        return res.status(401).send('Wrong username or password');
    }

})

app.post('/login', async (req, res) => {

    const { name, password } = req.body
    try {
        const user = await User.findAll({
            where: {
                name: name,
                password: password
            }
        })
        if (user.length === 0) {
            return res.status(401).send('Wrong username or password');
        }
        res.setHeader('Set-Cookie', 'isLoggedin=true');
        return res.cookie('user_id', user.id, { maxAge: 900000, httpOnly: false }).json({ user });
    } catch (error) {
        console.error(error)
        return res.status(401).send('Wrong username or password');
    }

})

app.get('/favorites/:userId', async (req, res) => {

    const userId = req.params.userId
    try {
        const favs = await Fav.findAll({
            where: {
                user_id: userId
            }
        }
        )
        return res.json({ favs })
    } catch (error) {
        console.error(error)
        return res.status(400).send('Something went wrong');
    }

})

app.post('/favorites', async (req, res) => {

    const { user_id, movie_id } = req.body
    try {
        const fav = await Fav.create({
            user_id: user_id,
            movie_id: movie_id
        })
        return res.json({ fav })
    } catch (error) {
        console.error(error)
        return res.status(400).send('Something went wrong');
    }

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));