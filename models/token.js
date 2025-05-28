// models/token.js
module.exports = (sequelize, DataTypes) => {
  const Token = sequelize.define('Token', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id'
    },
    accessToken: { // camelCase attribute name
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      field: 'access_token' // snake_case database column name
    },
    accessTokenExpiresAt: { // camelCase attribute name
      type: DataTypes.DATE,
      field: 'access_token_expires_at' // snake_case database column name
    },
    refreshToken: { // camelCase attribute name
      type: DataTypes.STRING,
      unique: true,
      field: 'refresh_token' // snake_case database column name
    },
    refreshTokenExpiresAt: { // camelCase attribute name
      type: DataTypes.DATE,
      field: 'refresh_token_expires_at' // snake_case database column name
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
    tableName: 'tokens',
    underscored: true, // Sequelize will handle automatic snake_casing for timestamps
  });

  Token.associate = (models) => {
    Token.belongsTo(models.Client, { foreignKey: 'clientId', as: 'client' }); // Use camelCase for association foreignKey
  };

  // --- OAuth Model Methods ---
  Token.saveToken = async (token, client, user) => {
    console.log('Token Model: saveToken called', { token, client, user });
    await Token.create({
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      scope: token.scope,
      clientId: client.clientId,
      userId: user ? user.id : null,
    });
    return {
      accessToken: token.accessToken,
      accessTokenExpiresAt: token.accessTokenExpiresAt,
      refreshToken: token.refreshToken,
      refreshTokenExpiresAt: token.refreshTokenExpiresAt,
      client: { id: client.clientId },
      user: user,
    };
  };

  Token.getAccessToken = async (accessToken) => {
    console.log(`Token Model: getAccessToken called for token: ${accessToken}`);
    const token = await Token.findOne({
      where: { accessToken: accessToken }, // Use camelCase here
      include: [{ model: sequelize.models.Client, as: 'client' }]
    });
    if (token && token.accessTokenExpiresAt > new Date()) { // Use camelCase here
      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        client: token.client ? { id: token.client.id } : null,
        user: token.userId ? { id: token.userId } : null,
      };
    }
    return null;
  };

  Token.getRefreshToken = async (refreshToken) => {
    console.log(`Token Model: getRefreshToken called for token: ${refreshToken}`);
    const token = await Token.findOne({
      where: { refreshToken: refreshToken }, // Use camelCase here
      include: [{ model: sequelize.models.Client, as: 'client' }]
    });
    if (token && token.refreshTokenExpiresAt > new Date()) { // Use camelCase here
      return {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        refreshToken: token.refreshToken,
        refreshTokenExpiresAt: token.refreshTokenExpiresAt,
        scope: token.scope,
        client: token.client ? { id: token.client.id } : null,
        user: token.userId ? { id: token.userId } : null,
      };
    }
    return null;
  };

  Token.revokeToken = async (token) => {
    console.log('Token Model: revokeToken called', token);
    const revoked = await Token.destroy({ where: { refreshToken: token.refreshToken } }); // Use camelCase here
    return !!revoked;
  };

  return Token;
};