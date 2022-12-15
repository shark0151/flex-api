const { Sequelize } = require('sequelize');
const sequelize = new Sequelize('postgres://flex_user:w8EUofyBa0h6obRCmlFzlEW6xMjfgDFO@dpg-cead3qmn6mphc8t5t9ng-a/flex_db')

module.exports = sequelize;