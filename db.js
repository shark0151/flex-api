const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://flex_user:w8EUofyBa0h6obRCmlFzlEW6xMjfgDFO@dpg-cead3qmn6mphc8t5t9ng-a/flex_db')

try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');
} catch (error) {
    console.error('Unable to connect to the database:', error);
}



module.exports = sequelize;