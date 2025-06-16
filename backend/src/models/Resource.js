const { query } = require('../database');
const axios = require('axios');

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
  static async claimResource(resourceId, userId, userGithubUsername) {
    // Check if resource exists
    const resource = await this.findById(resourceId);
    if (!resource) {
      throw new Error('Resource not found');
    }

    // Check if already claimed
    if (resource.claimed_by) {
      throw new Error('Resource is already claimed by another user');
    }

    // Verify GitHub ownership
    if (!resource.github_url) {
      throw new Error('Resource has no GitHub URL - cannot verify ownership');
    }

    const isOwner = await this.verifyGitHubOwnership(resource.github_url, userGithubUsername);
    if (!isOwner) {
      throw new Error('You can only claim resources that you own on GitHub. This resource belongs to a different GitHub user.');
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

  static async canUserClaimResource(resourceId, userGithubUsername) {
    const resource = await this.findById(resourceId);
    if (!resource) {
      return { canClaim: false, reason: 'Resource not found' };
    }

    if (resource.claimed_by) {
      return { canClaim: false, reason: 'Already claimed by another user' };
    }

    if (!resource.github_url) {
      return { canClaim: false, reason: 'No GitHub URL available' };
    }

    const isOwner = await this.verifyGitHubOwnership(resource.github_url, userGithubUsername);
    if (!isOwner) {
      return { canClaim: false, reason: 'Not the GitHub repository owner' };
    }

    return { canClaim: true, reason: 'Can claim - you own this repository' };
  }

  // Helper function to check GitHub repository ownership
  static async verifyGitHubOwnership(githubUrl, userGithubUsername) {
    try {
      // Extract owner and repo from GitHub URL
      const match = githubUrl.match(/github\.com\/([^\/]+)\/([^\/]+)/);
      if (!match) {
        return false;
      }
      
      const [, owner, repo] = match;
      
      // Simple check: if the GitHub username matches the repo owner
      return owner.toLowerCase() === userGithubUsername.toLowerCase();
    } catch (error) {
      console.error('Error verifying GitHub ownership:', error);
      return false;
    }
  }
}

module.exports = Resource;
