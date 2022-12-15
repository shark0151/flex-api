var express = require('express');
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
const port = process.env.PORT || 3001;
const { Sequelize } = require('sequelize');

const options = {
    definition: {
        openapi: "3.0.0",
        info: {
            title: "Goat API",
            version: "1.0.0",
            description: "A simple Express API",
        },
        servers: [
            {
                url: "https://threeam.onrender.com"
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
app.use(cors());
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.get('/', (req, res) => res.json({ message: 'Hello World' }))
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));

var db = require('./db');
const User = db.define('user', {

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

User.sync({ force: true }).then(() => {
    // Now the `users` table in the database corresponds to the model definition
    return User.create({
        name: 'John',
        password: '1234'
    });
});

app.get('/user/:userId', async (req, res) => {

    const userId = req.params.userId

    try {

        const user = await User.findAll({

            where: {

                id: userId

            }

        }

        )

        res.json({ user })

    } catch (error) {

        console.error(error)

    }

})

app.listen(port, () => console.log(`Example app listening on port ${port}!`));