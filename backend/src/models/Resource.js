const { query } = require('../database');

class Resource {
  static async findById(id) {
    const result = await query(
      'SELECT * FROM resources WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  }

  static async search(searchQuery, page = 1, pageSize = 100) {
    const offset = (page - 1) * pageSize;
    
    let whereClause = '';
    let queryParams = [];
    
    if (searchQuery && searchQuery.trim()) {
      whereClause = `WHERE name ILIKE $1 OR description ILIKE $1 OR language ILIKE $1`;
      queryParams = [`%${searchQuery.trim()}%`];
    }
    
    // Get total count
    const countQuery = `SELECT COUNT(*) FROM resources ${whereClause}`;
    const countResult = await query(countQuery, queryParams);
    const totalMatches = parseInt(countResult.rows[0].count);
    
    // Get results with user info for claimed resources
    const searchQuery2 = `
      SELECT 
        r.*,
        u.username as claimed_by_username,
        u.display_name as claimed_by_display_name
      FROM resources r
      LEFT JOIN users u ON r.claimed_by = u.id
      ${whereClause}
      ORDER BY r.stars DESC, r.name ASC
      LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}
    `;
    
    const searchParams = [...queryParams, pageSize, offset];
    const result = await query(searchQuery2, searchParams);
    
    return {
      results: result.rows,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalMatches / pageSize),
        totalMatches,
        pageSize,
        hasNext: page < Math.ceil(totalMatches / pageSize),
        hasPrevious: page > 1
      }
    };
  }

  static async claimResource(resourceId, userId) {
    // Check if resource exists
    const resource = await this.findById(resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // Check if already claimed
    if (resource.claimed_by) {
      throw new Error('Resource is already claimed by another user');
    }

    // Claim the resource
    const result = await query(
      'UPDATE resources SET claimed_by = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [userId, resourceId]
    );

    return result.rows[0];
  }

  static async unclaimResource(resourceId, userId) {
    // Check if resource exists and is claimed by this user
    const resource = await this.findById(resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    if (resource.claimed_by !== userId) {
      throw new Error('You can only unclaim resources you have claimed');
    }

    // Unclaim the resource
    const result = await query(
      'UPDATE resources SET claimed_by = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [resourceId]
    );

    return result.rows[0];
  }

  static async getClaimedByUser(userId) {
    const result = await query(
      'SELECT * FROM resources WHERE claimed_by = $1 ORDER BY updated_at DESC',
      [userId]
    );
    return result.rows;
  }

  static async getClaimStats() {
    const result = await query(`
      SELECT 
        COUNT(*) as total_resources,
        COUNT(claimed_by) as claimed_resources,
        COUNT(DISTINCT claimed_by) as unique_claimers
      FROM resources
    `);
    return result.rows[0];
  }
}

module.exports = Resource;
