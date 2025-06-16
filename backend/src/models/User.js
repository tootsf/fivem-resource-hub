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
      github_url,
      bio
    } = userData;

    const result = await query(`
      INSERT INTO users (github_id, username, display_name, email, avatar_url, github_url, bio)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [github_id, username, display_name, email, avatar_url, github_url, bio]);

    return result.rows[0];
  }

  static async update(id, userData) {
    const {
      username,
      display_name,
      email,
      avatar_url,
      github_url,
      bio
    } = userData;    const result = await query(`
      UPDATE users
      SET username = $2, display_name = $3, email = $4, avatar_url = $5,
          github_url = $6, bio = $7, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
      RETURNING *
    `, [id, username, display_name, email, avatar_url, github_url, bio]);

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
      SELECT
        u.*,
        COUNT(DISTINCT r.id) as claimed_resources_count,
        COUNT(DISTINCT rec.id) as recipes_count
      FROM users u
      LEFT JOIN resources r ON r.claimed_by = u.id
      LEFT JOIN recipes rec ON rec.user_id = u.id      WHERE u.id = $1
      GROUP BY u.id
    `, [userId]);

    return result.rows[0] || null;
  }

  static async getPublicProfile(username) {
    const result = await query(`
      SELECT
        u.id,
        u.username,
        u.display_name,
        u.avatar_url,
        u.github_url,
        u.bio,
        u.created_at,
        COUNT(DISTINCT r.id) as claimed_resources_count,
        COUNT(DISTINCT rec.id) as public_recipes_count
      FROM users u
      LEFT JOIN resources r ON r.claimed_by = u.id
      LEFT JOIN recipes rec ON rec.user_id = u.id AND rec.is_public = true      WHERE u.username = $1
      GROUP BY u.id
    `, [username]);

    return result.rows[0] || null;
  }
}

module.exports = User;
