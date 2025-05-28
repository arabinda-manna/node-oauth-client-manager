const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config.js')[env]; // Changed import path
const db = {};

let sequelize;
if (config.use_env_variable) {
  sequelize = new Sequelize(process.env[config.use_env_variable], config);
} else {
  sequelize = new Sequelize(config.database, config.username, config.password, config);
}

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Import models
db.Client = require('./client')(sequelize, Sequelize);
db.Token = require('./token')(sequelize, Sequelize);
db.AuthorizationCode = require('./authorizationcode')(sequelize, Sequelize);

// Set up associations
if (db.Token.associate) {
  db.Token.associate(db);
}
if (db.AuthorizationCode.associate) {
  db.AuthorizationCode.associate(db);
}
// Client model association (hasMany)
db.Client.associate = (models) => {
  db.Client.hasMany(models.Token, { foreignKey: 'client_id', as: 'tokens' });
  db.Client.hasMany(models.AuthorizationCode, { foreignKey: 'client_id', as: 'authorizationCodes' });
};

module.exports = db;