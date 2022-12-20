var express = require("express");
const cors = require("cors");
const { doubleCsrf } = require("csrf-csrf");
var bodyParser = require('body-parser');
const swaggerUI = require("swagger-ui-express");
const swaggerJsDoc = require("swagger-jsdoc");
var crypto = require('crypto');
var cookieParser = require("cookie-parser");
const port = process.env.PORT || 3001;
const { Sequelize } = require("sequelize");
const sequelize = new Sequelize("postgres://flex_user:w8EUofyBa0h6obRCmlFzlEW6xMjfgDFO@dpg-cead3qmn6mphc8t5t9ng-a/flex_db");

const doubleCsrfOptions = {
  cookieName: "flexy-psifi.x-csrf-token", // The name of the cookie to be used, recommend using Host prefix.
  cookieOptions: {
    httpOnly: false,
    sameSite: "none",  // Recommend you make this strict if posible
    path: "/",
    secure: false,
  },
  size: 64, // The size of the generated tokens in bits
  ignoredMethods: ["GET", "HEAD", "OPTIONS"], // A list of request methods that will not be protected.
  getTokenFromRequest: (req) => req.headers["X-XSRF-TOKEN"], // A function that returns the token from the request
};

const {
  invalidCsrfTokenError, // This is just for convenience if you plan on making your own middleware.
  generateToken, // Use this in your routes to provide a CSRF hash cookie and token.
  validateRequest, // Also a convenience if you plan on making your own middleware.
  doubleCsrfProtection, // This is the default CSRF protection middleware.
} = doubleCsrf(doubleCsrfOptions);


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
        url: "https://flex-api-45ah.onrender.com",
      },
      {
        url: "http://localhost:3001",
      },
    ],
  },
  apis: ["./app.js"],
};
const specs = swaggerJsDoc(options);
const app = express();


app.use(cors({
  origin: [
    "https://flex-app.onrender.com",
    "https://app.systemintegration.tk",
    "http://localhost:4200",
    'http://127.0.0.1:4200',
    "130.225.244.180",
    '100.20.92.101',
    '44.225.181.72',
    '44.227.217.144'],
  credentials: true
}));
app.use(express.json());
app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(doubleCsrfProtection);

app.get("/", (req, res) => res.json({ message: "Hello World" }));
app.get("/csrf", (req, res) => res.render("send-csrf-token", { csrfToken: req.csrfToken() }));
app.use("/docs", swaggerUI.serve, swaggerUI.setup(specs));


const User = sequelize.define(
  "user",
  {
    // attributes
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    salt: {
      type: Sequelize.STRING,
      allowNull: false
    },
  },
  {
    // options
  }
);

const Fav = sequelize.define(
  "favorites",
  {
    // attributes
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    movie_id: {
      type: Sequelize.INTEGER,

      allowNull: false,
    },
    is_TV: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
  },
  {
    // options
  }
);

User.sync({ force: true }).then(() => { });

Fav.sync({ force: true }).then(() => { });

/**
 * @swagger
 * /user/{userId}:
 *   get:
 *     summary: Login with password
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the user to get
 *     responses:
 *       400:
 *         description: Please fill out all fields
 *       401:
 *         description: authentication failed
 *       500:
 *         description: Internal server error
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: User ID
 *                     name:
 *                       type: string
 *                       description: Username
 *                   example:
 *                     id: 1
 *                     name: JohnnyBoy
 */


app.get("/user/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const authuser = await User.findOne({
      where: {
        id: userId,
      },
    });
    if (!authuser) {
      return res.status(401).send("user not found");
    }
    var user = {
      id: authuser.id,
      name: authuser.name
    }
    return res.json({ user });
  } catch (error) {
    console.error(error);
  }
});


/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Sign up with password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Username
 *               password:
 *                 type: string
 *                 description: Password
 *             example:
 *               username: JohnnyBoy
 *               password: Password123
 *     responses:
 *       400:
 *         description: Please fill out all fields
 *       401:
 *         description: User already exists
 *       500:
 *         description: Internal server error
 *       200:
 *         description: signed up successfully
 */


app.post("/signup", async (req, res) => {
  const { name, password } = req.body;
  const t = await sequelize.transaction();
  try {
    const a = await User.findAll({
      where: {
        name: name
      },
    });
    if (a.length > 0) {
      return res.status(401).send("User already exists");
    }
    var salt = crypto.randomBytes(16).toString('base64');
    const newuser = await User.create(
      {
        name: name,
        password: crypto.createHash('RSA-SHA256').update(password).update(salt).digest('hex'),
        salt: salt
      },
      { transaction: t }
    );
    await t.commit();

    if (!newuser) {
      return res.status(401).send("something went wrong");
    }
    var user = {
      id: newuser.id,
      name: newuser.name
    }
    //res.cookie("user_id", user.id, { maxAge: 900000, httpOnly: true, SameSite: 'None', Secure: true });
    return res.json({ user });
  } catch (error) {
    console.error(error);
    await t.rollback();
    return res.status(401).send("Wrong username or password");
  }
});

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Login with password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Username
 *               password:
 *                 type: string
 *                 description: Password
 *             example:
 *               username: JohnnyBoy
 *               password: Password123
 *     responses:
 *       400:
 *         description: Please fill out all fields
 *       401:
 *         description: authentication failed
 *       500:
 *         description: Internal server error
 *       200:
 *         description: Logged in successfully
 */

app.post("/login", async (req, res) => {
  const { name, password } = req.body;
  try {
    const authuser = await User.findOne({
      where: {
        name: name,
      },
    });
    if (authuser === null) {
      return res.status(401).send("Wrong username or password");
    }
    if (authuser.password !== crypto.createHash('RSA-SHA256').update(password).update(authuser.salt).digest('hex')) {
      return res.status(401).send("Wrong username or password");
    }

    var user = {
      id: authuser.id,
      name: authuser.name
    }
    //res.cookie("user_id", user.id, { maxAge: 900000, httpOnly: true, SameSite: 'None', Secure: true })
    return res.json({ user });
  } catch (error) {
    console.error(error);
    return res.status(401).send("Wrong username or password");
  }
});

/**
 * @swagger
 * /favorites/{userId}:
 *   get:
 *     summary: Get favorites of user
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the user to get
 *     responses:
 *       400:
 *         description: Something went wrong
 *       401:
 *         description: authentication failed
 *       500:
 *         description: Internal server error
 *       200:
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Favorite ID
 *                       user_id:
 *                         type: integer
 *                         description: User ID
 *                       movie_id:
 *                         type: integer
 *                         description: Movie ID
 *                       is_TV:
 *                         type: boolean
 *                         description: Is a TV show
 *                   example:
 *                     - id: 1
 *                       user_id: 1
 *                       movie_id: 1
 *                       is_TV: false
 */

app.get("/favorites/:userId", async (req, res) => {
  const userId = req.params.userId;
  try {
    const favs = await Fav.findAll({
      where: {
        user_id: userId,
      },
    });
    return res.json({ favs });
  } catch (error) {
    console.error(error);
    return res.status(400).send("Something went wrong");
  }
});

/**
 * @swagger
 * /favorites:
 *   post:
 *     summary: Add favorite
 *     tags: [Favorites]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user_id:
 *                 type: integer
 *                 description: User ID
 *               movie_id:
 *                 type: integer
 *                 description: Movie ID
 *               is_TV:
 *                 type: boolean
 *                 description: Is a TV show
 *             example:
 *               user_id: 1
 *               movie_id: 1
 *               is_TV: false
 *     responses:
 *       400:
 *         description: Please fill out all fields
 *       401:
 *         description: authentication failed
 *       500:
 *         description: Internal server error
 *       200:
 *         description: Logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fav:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Favorite ID
 *                     user_id:
 *                       type: integer
 *                       description: User ID
 *                     movie_id:
 *                       type: integer
 *                       description: Movie ID
 *                     is_TV:
 *                       type: boolean
 *                       description: Is a TV show
 *                   example:
 *                     id: 1
 *                     user_id: 1
 *                     movie_id: 1
 *                     is_TV: false
 */

app.post("/favorites", async (req, res) => {
  const t = await sequelize.transaction();
  const { user_id, movie_id, is_TV } = req.body;
  try {
    const isfav = await Fav.findAll(
      {
        where: {
          user_id: user_id,
          movie_id: movie_id,
          is_TV: is_TV,
        },
      },
      { transaction: t }
    );
    if (isfav.length > 0) {
      return res.status(401).send("Already favourited");
    }
    const fav = await Fav.create({
      user_id: user_id,
      movie_id: movie_id,
      is_TV: is_TV,
    });
    await t.commit();
    return res.json({ fav });
  } catch (error) {
    console.error(error);
    await t.rollback();
    return res.status(400).send("Something went wrong");
  }
});

/**
 * @swagger
 * /favorites/{userId}/{movieId}:
 *   get:
 *     summary: Get favorites of user
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the user to get
 *       - in: path
 *         name: movieId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the movie to get
 *     responses:
 *       400:
 *         description: Something went wrong
 *       401:
 *         description: authentication failed
 *       500:
 *         description: Internal server error
 *       200:
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isfav:
 *                   type: boolean
 *                   description: Movie is favorited by user
 *                   example: true
 */

app.get("/favorites/:userId/:movieId", async (req, res) => {
  const userId = req.params.userId;
  const movieId = req.params.movieId;
  try {
    const fav = await Fav.findAll({
      where: {
        user_id: userId,
        movie_id: movieId,
      },
    });
    const isfav = fav.length > 0;
    return res.json({ isfav });
  } catch (error) {
    console.error(error);
    return res.status(400).send("Something went wrong");
  }
});

/**
 * @swagger
 * /favorites/{userId}/{movieId}:
 *   delete:
 *     summary: Delete favorite of user
 *     tags: [Favorites]
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the user to get
 *       - in: path
 *         name: movieId
 *         schema:
 *           type: integer
 *         required: true
 *         description: Numeric ID of the movie to get
 *     responses:
 *       400:
 *         description: Something went wrong
 *       401:
 *         description: authentication failed
 *       500:
 *         description: Internal server error
 *       200:
 *         description: Favorites retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 fav:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                       description: Favorite ID
 *                     user_id:
 *                       type: integer
 *                       description: User ID
 *                     movie_id:
 *                       type: integer
 *                       description: Movie ID
 *                     is_TV:
 *                       type: boolean
 *                       description: Is a TV show
 *                   example:
 *                     id: 1
 *                     user_id: 1
 *                     movie_id: 1
 *                     is_TV: false
 */

app.delete("/favorites/:userId/:movieId", async (req, res) => {
  const userId = req.params.userId;
  const movieId = req.params.movieId;
  const t = await sequelize.transaction();
  try {
    const fav = await Fav.destroy(
      {
        where: {
          user_id: userId,
          movie_id: movieId,
        },
      },
      { transaction: t }
    );
    await t.commit();
    return res.json({ fav });
  } catch (error) {
    console.error(error);
    await t.rollback();
    return res.status(400).send("Something went wrong");
  }
});

app.listen(port, () => console.log(`Flex-Api listening on port ${port}!`));
