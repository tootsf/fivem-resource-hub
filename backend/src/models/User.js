const { query } = require('../database');

class User {  static async findByGithubId(githubId) {
    const result = await query(
      'SELECT * FROM users WHERE github_id = $1',
      [githubId]
    );
    return result.rows[0] || null;
  }

  static async findById(id) {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async findByUsername(username) {
    const result = await query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0] || null;
  }
  static async create(userData) {
    const {
      github_id,
      username,
      display_name,
      email,
      avatar_url,
      bio
    } = userData;

    const result = await query(`
      INSERT INTO users (github_id, username, display_name, email, avatar_url, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [github_id, username, display_name, email, avatar_url, bio]);

    return result.rows[0];
  }

  static async update(id, userData) {    const {
      username,
      display_name,
      email,
      avatar_url,
      bio
    } = userData;

    const result = await query(`
      UPDATE users
      SET username = $2, display_name = $3, email = $4, avatar_url = $5,
          bio = $6, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, username, display_name, email, avatar_url, bio]);

    return result.rows[0] || null;
  }

  static async updateProfile(id, profileData) {
    const { display_name, bio } = profileData;    const result = await query(`
      UPDATE users
      SET display_name = $2, bio = $3, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, display_name, bio]);

    return result.rows[0] || null;  }
  static async getProfile(userId) {
    const result = await query(`
      SELECT *
      FROM users
      WHERE id = $1
    `, [userId]);

    return result.rows[0] || null;
  }
  static async getPublicProfile(username) {
    const result = await query(`
      SELECT
        id,
        username,
        display_name,
        avatar_url,
        bio,
        created_at
      FROM users
      WHERE username = $1
    `, [username]);

    return result.rows[0] || null;
  }
  static async delete(userId) {
    const result = await query(
      'DELETE FROM users WHERE id = $1 RETURNING *',
      [userId]
    );
    return result.rows[0] || null;
  }
}

module.exports = User;
