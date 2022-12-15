var express = require('express');
const cors = require("cors");
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");

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
                url: "http://localhost:3000"
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
const port = 3000
app.use(express.json());
app.use(cors());
var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');



app.get('/', (req, res) => res.json({ message: 'Hello World' }))

app.listen(port, () => console.log(`Example app listening on port ${port}!`))