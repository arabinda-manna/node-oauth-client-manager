'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('authorization_codes', { // Table name in snake_case
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
        field: 'id'
      },
      authorization_code: { // Column name in snake_case
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
        field: 'authorization_code'
      },
      expires_at: { // Column name in snake_case
        type: Sequelize.DATE,
        field: 'expires_at'
      },
      redirect_uri: { // Column name in snake_case
        type: Sequelize.STRING,
        field: 'redirect_uri'
      },
      scope: {
        type: Sequelize.STRING,
        field: 'scope'
      },
      client_id: { // Column name in snake_case
        type: Sequelize.STRING,
        references: {
          model: 'clients', // Refers to the 'clients' table
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'client_id'
      },
      user_id: { // Column name in snake_case
        type: Sequelize.STRING,
        field: 'user_id'
      },
      created_at: { // Column name in snake_case
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updated_at: { // Column name in snake_case
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('authorization_codes');
  }
};