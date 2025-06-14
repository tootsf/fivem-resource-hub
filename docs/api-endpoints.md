# API Endpoints Documentation

## Authentication Endpoints

### GitHub OAuth
```
GET /auth/github
- Redirects to GitHub OAuth authorization page

GET /auth/github/callback?code=xxx
- Handles GitHub OAuth callback
- Creates/updates user record
- Returns JWT token or sets session cookie

POST /auth/logout
- Invalidates user session
- Clears authentication cookies

GET /auth/me
- Returns current user profile
- Requires authentication
```

## User Endpoints

### Profile Management
```
GET /api/users/profile
- Get current user's profile
- Includes claimed resources and recipes

PUT /api/users/profile
- Update user profile (display_name, bio)
- Requires authentication

GET /api/users/:username
- Get public user profile
- Shows public recipes and claimed resources

GET /api/users/:username/resources
- Get resources claimed by user
- Public endpoint

GET /api/users/:username/recipes
- Get public recipes by user
```

## Resource Endpoints

### Resource Discovery
```
GET /api/resources/search?q=query&category=scripts&framework=esx&page=1&sort=rating
- Enhanced search with filters
- Sort by: rating, stars, recent, alphabetical
- Pagination with 20 results per page

GET /api/resources/:id
- Get detailed resource information
- Includes reviews, rating summary, and metadata

POST /api/resources/:id/claim
- Claim ownership of a resource
- Requires GitHub repo access verification
- Requires authentication

PUT /api/resources/:id/metadata
- Update resource metadata (tags, category, compatibility)
- Only by resource owner or admin
- Requires authentication

GET /api/resources/:id/reviews
- Get paginated reviews for resource
- Includes vote counts and user info

POST /api/resources/:id/download
- Track download count
- Optional analytics endpoint
```

### Resource Management
```
POST /api/resources/sync
- Sync resource data from GitHub
- Updates stars, forks, last_updated
- Can be triggered by webhook or cron

GET /api/resources/categories
- Get list of available categories

GET /api/resources/frameworks
- Get list of supported frameworks
```

## Review Endpoints

### Review Management
```
POST /api/resources/:id/reviews
- Create new review
- Requires authentication
- Body: { rating, title, content, pros, cons, recommended }

PUT /api/reviews/:reviewId
- Update existing review
- Only by review author
- Requires authentication

DELETE /api/reviews/:reviewId
- Delete review
- Only by review author or admin
- Requires authentication

POST /api/reviews/:reviewId/vote
- Vote on review helpfulness
- Body: { helpful: true/false }
- Requires authentication

GET /api/reviews/:reviewId/votes
- Get vote summary for review
```

## Recipe Endpoints

### Recipe Management
```
GET /api/recipes/my
- Get current user's recipes
- Includes private recipes
- Requires authentication

POST /api/recipes
- Create new recipe
- Body: { name, description, is_public, framework, server_type, tags }
- Requires authentication

GET /api/recipes/:id
- Get recipe details with items
- Public recipes or owned recipes only

PUT /api/recipes/:id
- Update recipe metadata
- Only by recipe owner
- Requires authentication

DELETE /api/recipes/:id
- Delete recipe
- Only by recipe owner
- Requires authentication

POST /api/recipes/:id/items
- Add resource to recipe
- Body: { resource_id, install_order, install_notes, environment_vars, custom_config }
- Requires authentication

PUT /api/recipes/:id/items/:itemId
- Update recipe item
- Requires authentication

DELETE /api/recipes/:id/items/:itemId
- Remove item from recipe
- Requires authentication

POST /api/recipes/:id/items/reorder
- Reorder recipe items
- Body: { items: [{ id, install_order }] }
- Requires authentication
```

### Recipe Export
```
GET /api/recipes/:id/export/yaml
- Generate YAML file for recipe
- Returns downloadable file

GET /api/recipes/:id/export/json
- Export recipe as JSON
- For programmatic use

POST /api/recipes/:id/fork
- Create a copy of public recipe
- Requires authentication
```

## Public Discovery Endpoints

```
GET /api/discover/trending
- Get trending resources (high recent download/rating activity)

GET /api/discover/new
- Get recently added resources

GET /api/discover/top-rated
- Get highest rated resources

GET /api/discover/recipes/featured
- Get featured public recipes

GET /api/stats/summary
- Get platform statistics
- Total resources, users, reviews, etc.
```

## Admin Endpoints (Future)

```
GET /api/admin/resources/pending
- Get resources pending verification

POST /api/admin/resources/:id/verify
- Verify resource ownership claim

GET /api/admin/reports/reviews
- Get reported reviews for moderation

DELETE /api/admin/reviews/:id
- Remove inappropriate review
```

## Webhook Endpoints

```
POST /webhooks/github
- Handle GitHub webhook events
- Update resource data on repo changes
- Verify webhook signature
```

## Response Formats

### Standard Success Response
```json
{
  "success": true,
  "data": { ... },
  "message": "Optional success message"
}
```

### Standard Error Response
```json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": { ... }
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "page": 1,
    "per_page": 20,
    "total": 150,
    "total_pages": 8,
    "has_next": true,
    "has_previous": false
  }
}
```
