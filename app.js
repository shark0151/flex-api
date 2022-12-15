var express = require('express');
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
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
app.use(cors({ origin: ["https://flex-api-45ah.onrender.com", "http://localhost:"+ port], credentials: true}));

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

    return User.create({
        name: 'Jim',
        password: '1234'
    });
});

Fav.sync({ force: true }).then(() => {

    return Fav.create({
        user_id: 1,
        movie_id: 1
    });
});

app.get('/user/:userId', async (req, res) => {

    const userId = req.params.userId
    try {
        const user = await User.findAll({
            where: {
                id: userId
            }
        })
        res.json({ user })

    } catch (error) {
        console.error(error)
    }
})

app.post('/user', async (req, res) => {

    const { name, password } = req.body
    try {
        const user = await User.create({
            name: name,
            password: password
        })
        res.json({ user })
    } catch (error) {
        console.error(error)
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
        res.json({ user })
    } catch (error) {
        console.error(error)
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
        res.json({ favs })
    } catch (error) {
        console.error(error)
    }

})

app.post('/favorites', async (req, res) => {

    const { user_id, movie_id } = req.body
    try {
        const fav = await Fav.create({
            user_id: user_id,
            movie_id: movie_id
        })
        res.json({ fav })
    } catch (error) {
        console.error(error)
    }

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));