const { query } = require('../database');
const crypto = require('crypto');

class Session {
  static generateToken() {
    return crypto.randomBytes(32).toString('hex');
  }

  static async create(sessionData) {
    const {
      user_id,
      github_access_token,
      expires_at
    } = sessionData;

    const session_token = this.generateToken();

    // Encrypt the GitHub access token before storing
    const encrypted_token = this.encrypt(github_access_token);

    const result = await query(`
      INSERT INTO user_sessions (user_id, session_token, github_access_token, expires_at)
      VALUES ($1, $2, $3, $4)
      RETURNING session_token, expires_at, created_at
    `, [user_id, session_token, encrypted_token, expires_at]);

    return result.rows[0];
  }

  static async findByToken(token) {
    const result = await query(`
      SELECT s.*, u.*
      FROM user_sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = $1 AND s.expires_at > CURRENT_TIMESTAMP AND u.is_active = true
    `, [token]);

    return result.rows[0] || null;
  }

  static async findByUserId(userId) {
    const result = await query(
      'SELECT * FROM user_sessions WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async deleteByToken(token) {
    const result = await query(
      'DELETE FROM user_sessions WHERE session_token = $1 RETURNING *',
      [token]
    );
    return result.rows[0] || null;
  }

  static async deleteByUserId(userId) {
    const result = await query(
      'DELETE FROM user_sessions WHERE user_id = $1',
      [userId]
    );
    return result.rowCount;
  }

  static async cleanupExpired() {
    const result = await query(
      'DELETE FROM user_sessions WHERE expires_at <= CURRENT_TIMESTAMP'
    );
    return result.rowCount;
  }

  static async getGithubToken(userId) {
    const result = await query(
      'SELECT github_access_token FROM user_sessions WHERE user_id = $1 AND expires_at > CURRENT_TIMESTAMP ORDER BY created_at DESC LIMIT 1',
      [userId]
    );

    if (result.rows[0]?.github_access_token) {
      return this.decrypt(result.rows[0].github_access_token);
    }
    return null;
  }

  // Simple encryption/decryption for GitHub tokens
  static encrypt(text) {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipher(algorithm, key);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  static decrypt(encryptedData) {
    if (!process.env.ENCRYPTION_KEY) {
      throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    const algorithm = 'aes-256-gcm';
    const key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

    const parts = encryptedData.split(':');
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];

    const decipher = crypto.createDecipher(algorithm, key);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  }
}

module.exports = Session;
