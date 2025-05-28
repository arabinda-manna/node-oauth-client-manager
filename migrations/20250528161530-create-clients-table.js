'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clients', {
      id: {
        allowNull: false,
        primaryKey: true,
        type: Sequelize.STRING,
        field: 'id'
      },
      name: { // Add the name column
        type: Sequelize.STRING,
        allowNull: false,
        field: 'name'
      },
      secret: {
        type: Sequelize.STRING,
        allowNull: false,
        field: 'secret'
      },
      grants: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        field: 'grants'
      },
      redirect_uris: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        allowNull: false,
        field: 'redirect_uris'
      },
      created_at: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'created_at'
      },
      updated_at: {
        allowNull: false,
        type: Sequelize.DATE,
        field: 'updated_at'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clients');
  }
};