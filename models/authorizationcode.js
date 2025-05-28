// models/authorizationcode.js
module.exports = (sequelize, DataTypes) => {
  const AuthorizationCode = sequelize.define('AuthorizationCode', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    authorizationCode: { // camelCase attribute name
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'authorization_code' // snake_case database column name
    },
    expiresAt: { // camelCase attribute name
      type: DataTypes.DATE,
      field: 'expires_at' // snake_case database column name
    },
    redirectUri: { // camelCase attribute name
      type: DataTypes.STRING,
      field: 'redirect_uri' // snake_case database column name
    },
    scope: {
      type: DataTypes.STRING,
      field: 'scope'
    },
    clientId: { // camelCase attribute name (foreign key)
      type: DataTypes.STRING,
      references: {
        model: 'clients',
        key: 'id'
      },
      field: 'client_id' // snake_case database column name
    },
    userId: { // camelCase attribute name
      type: DataTypes.STRING,
      field: 'user_id' // snake_case database column name
    },
    createdAt: {
      type: DataTypes.DATE,
      field: 'created_at'
    },
    updatedAt: {
      type: DataTypes.DATE,
      field: 'updated_at'
    }
  }, {
    tableName: 'authorization_codes',
    underscored: true, // Sequelize will handle automatic snake_casing for timestamps
  });

  AuthorizationCode.associate = (models) => {
    AuthorizationCode.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' }); // Use camelCase for association foreignKey
  };

  // --- OAuth Model Methods ---
  AuthorizationCode.saveAuthorizationCode = async (code, client, user) => {
    console.log('AuthorizationCode Model: saveAuthorizationCode called', { code, client, user });
    await AuthorizationCode.create({
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: code.scope,
      clientId: client.clientId,
      userId: user ? user.id : null,
    });
    return {
      authorizationCode: code.authorizationCode,
      expiresAt: code.expiresAt,
      redirectUri: code.redirectUri,
      scope: code.scope,
      client: { id: client.clientId },
      user: user,
    };
  };

  AuthorizationCode.getAuthorizationCode = async (authorizationCode) => {
    console.log(`AuthorizationCode Model: getAuthorizationCode called for code: ${authorizationCode}`);
    const code = await AuthorizationCode.findOne({
      where: { authorizationCode: authorizationCode }, // Use camelCase here
      include: [{ model: sequelize.models.Client, as: 'client' }]
    });
    if (code && code.expiresAt > new Date()) { // Use camelCase here
      return {
        authorizationCode: code.authorizationCode,
        expiresAt: code.expiresAt,
        redirectUri: code.redirectUri,
        scope: code.scope,
        client: code.client ? { id: code.client.id } : null,
        user: code.userId ? { id: code.userId } : null,
      };
    }
    return null;
  };

  AuthorizationCode.revokeAuthorizationCode = async (code) => {
    console.log('AuthorizationCode Model: revokeAuthorizationCode called', code);
    const revoked = await AuthorizationCode.destroy({ where: { authorizationCode: code.authorizationCode } }); // Use camelCase here
    return !!revoked;
  };

  return AuthorizationCode;
};