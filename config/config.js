require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    host: process.env.DB_HOST,
    dialect: process.env.DB_DIALECT || 'postgres', // Provide a default if not in .env
  },
  test: {
    username: process.env.DB_USERNAME_TEST || process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD_TEST || process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE_TEST || `${process.env.DB_DATABASE}_test`,
    host: process.env.DB_HOST || '127.0.0.1',
    dialect: process.env.DB_DIALECT || 'postgres', // Provide a default if not in .env
  },
  production: {
    use_env_variable: 'DATABASE_URL',
    dialect: process.env.DB_DIALECT || 'postgres', // Provide a default if not in .env
    dialectOptions: {
      ssl: {
        require: true,
        rejectUnauthorized: false,
      },
    },
  },
};