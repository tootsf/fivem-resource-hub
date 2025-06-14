# UI/UX Flow Design

## 1. User Journey Map

### New User Journey
```
1. Landing Page → Browse Resources (no auth required)
2. Click "Sign in with GitHub" → OAuth flow
3. Return to dashboard → Profile setup prompt
4. Guided tour of features (claiming, reviews, recipes)
```

### Resource Creator Journey
```
1. Browse resources → Find their own resource
2. Click "Claim this resource" → Verify ownership
3. Add metadata (tags, category, compatibility)
4. Receive notifications for reviews
5. Respond to user feedback
```

### Resource Consumer Journey
```
1. Search/browse resources
2. Read reviews and ratings
3. Add resources to recipe queue
4. Configure installation order and settings
5. Export YAML recipe
```

## 2. Key UI Components

### Navigation Header
```javascript
// components/Header.js
const Header = () => {
  const { user, isAuthenticated } = useAuth();
  
  return (
    <header className="site-header">
      <div className="container">
        <Logo />
        
        <nav className="main-nav">
          <NavLink to="/browse">Browse Resources</NavLink>
          <NavLink to="/recipes/public">Community Recipes</NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/dashboard">Dashboard</NavLink>
              <NavLink to="/recipes/my">My Recipes</NavLink>
            </>
          )}
        </nav>

        <div className="header-actions">
          <RecipeQueueButton /> {/* Shows count of queued resources */}
          <LoginButton />
        </div>
      </div>
    </header>
  );
};
```

### Resource Card Component
```javascript
// components/ResourceCard.js
const ResourceCard = ({ resource, showActions = true }) => {
  const { user } = useAuth();
  const [isQueued, setIsQueued] = useState(false);

  return (
    <div className="resource-card">
      <div className="resource-header">
        <div className="resource-info">
          <h3 className="resource-name">{resource.name}</h3>
          <div className="resource-meta">
            <span className="category">{resource.fivem_category}</span>
            <span className="language">{resource.language}</span>
            {resource.framework_compatibility && (
              <div className="frameworks">
                {resource.framework_compatibility.map(fw => (
                  <span key={fw} className="framework-tag">{fw}</span>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="resource-stats">
          <StarRating rating={resource.average_rating} readonly />
          <span className="review-count">({resource.total_reviews})</span>
          <span className="github-stars">⭐ {resource.stars}</span>
        </div>
      </div>

      {resource.description && (
        <p className="resource-description">{resource.description}</p>
      )}

      {resource.tags && (
        <div className="resource-tags">
          {resource.tags.map(tag => (
            <span key={tag} className="tag">{tag}</span>
          ))}
        </div>
      )}

      {showActions && (
        <div className="resource-actions">
          <button 
            onClick={() => addToQueue(resource.id)}
            className={`queue-btn ${isQueued ? 'queued' : ''}`}
          >
            {isQueued ? '✓ Queued' : '+ Add to Recipe'}
          </button>
          
          <a href={resource.github_repo_url} target="_blank" className="github-link">
            View on GitHub
          </a>
          
          {resource.claimed_by === user?.id && (
            <button className="edit-btn">Edit Metadata</button>
          )}
          
          {!resource.claimed_by && user && (
            <button className="claim-btn">Claim Resource</button>
          )}
        </div>
      )}
    </div>
  );
};
```

### Review System Component
```javascript
// components/ReviewSystem.js
const ReviewSystem = ({ resourceId }) => {
  const [reviews, setReviews] = useState([]);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);

  return (
    <div className="review-system">
      <div className="review-summary">
        <div className="rating-overview">
          <div className="average-rating">
            <StarRating rating={averageRating} size="large" />
            <span className="rating-text">{averageRating.toFixed(1)} out of 5</span>
          </div>
          <div className="rating-breakdown">
            {[5,4,3,2,1].map(stars => (
              <div key={stars} className="rating-bar">
                <span>{stars}★</span>
                <div className="bar">
                  <div 
                    className="fill" 
                    style={{ width: `${(starCounts[stars] / totalReviews) * 100}%` }}
                  />
                </div>
                <span>{starCounts[stars]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="review-actions">
        {userReview ? (
          <div className="user-review-status">
            <span>You reviewed this resource</span>
            <button onClick={() => setShowReviewForm(true)}>Edit Review</button>
          </div>
        ) : (
          <button 
            onClick={() => setShowReviewForm(true)}
            className="write-review-btn"
          >
            Write a Review
          </button>
        )}
      </div>

      {showReviewForm && (
        <ReviewForm 
          resourceId={resourceId}
          existingReview={userReview}
          onSubmit={handleReviewSubmit}
          onCancel={() => setShowReviewForm(false)}
        />
      )}

      <div className="reviews-list">
        {reviews.map(review => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </div>
    </div>
  );
};
```

### Recipe Builder Component
```javascript
// components/RecipeBuilder.js
const RecipeBuilder = () => {
  const [queuedResources, setQueuedResources] = useState([]);
  const [recipeMetadata, setRecipeMetadata] = useState({
    name: '',
    description: '',
    framework: 'esx',
    server_type: 'roleplay',
    is_public: false
  });

  return (
    <div className="recipe-builder">
      <div className="recipe-header">
        <h2>Build Your Recipe</h2>
        <div className="recipe-actions">
          <button onClick={saveRecipe}>Save Recipe</button>
          <button onClick={exportYAML}>Export YAML</button>
          <button onClick={clearQueue}>Clear All</button>
        </div>
      </div>

      <div className="recipe-metadata">
        <input
          placeholder="Recipe Name"
          value={recipeMetadata.name}
          onChange={(e) => setRecipeMetadata({...recipeMetadata, name: e.target.value})}
        />
        <textarea
          placeholder="Description"
          value={recipeMetadata.description}
          onChange={(e) => setRecipeMetadata({...recipeMetadata, description: e.target.value})}
        />
        <select
          value={recipeMetadata.framework}
          onChange={(e) => setRecipeMetadata({...recipeMetadata, framework: e.target.value})}
        >
          <option value="esx">ESX</option>
          <option value="qbcore">QBCore</option>
          <option value="standalone">Standalone</option>
        </select>
      </div>

      <DragDropContext onDragEnd={handleReorder}>
        <Droppable droppableId="recipe-items">
          {(provided) => (
            <div {...provided.droppableProps} ref={provided.innerRef} className="recipe-items">
              {queuedResources.map((item, index) => (
                <Draggable key={item.id} draggableId={item.id.toString()} index={index}>
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className="recipe-item"
                    >
                      <RecipeItemCard 
                        item={item} 
                        index={index}
                        onRemove={() => removeFromQueue(item.id)}
                        onConfigChange={(config) => updateItemConfig(item.id, config)}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {queuedResources.length === 0 && (
        <div className="empty-queue">
          <p>No resources in your recipe yet.</p>
          <button onClick={() => navigate('/browse')}>Browse Resources</button>
        </div>
      )}
    </div>
  );
};
```

## 3. Page Layouts

### Browse Resources Page
```
┌─────────────────────────────────────────────┐
│ Header with Search + Login + Queue Count    │
├─────────────────────────────────────────────┤
│ Filters Sidebar  │  Resource Grid            │
│                  │                           │
│ • Categories     │  [Resource Card]          │
│ • Frameworks     │  [Resource Card]          │
│ • Languages      │  [Resource Card]          │
│ • Rating         │  [Resource Card]          │
│ • Tags           │                           │
│                  │  Pagination               │
└─────────────────────────────────────────────┘
```

### Resource Detail Page
```
┌─────────────────────────────────────────────┐
│ Header                                       │
├─────────────────────────────────────────────┤
│ Resource Header (Name, Rating, Actions)     │
├─────────────────────────────────────────────┤
│ Description + Metadata + Tags               │
├─────────────────────────────────────────────┤
│ Installation Instructions (if claimed)      │
├─────────────────────────────────────────────┤
│ Review Summary + Write Review Button        │
├─────────────────────────────────────────────┤
│ Reviews List                                │
└─────────────────────────────────────────────┘
```

### Recipe Builder Page
```
┌─────────────────────────────────────────────┐
│ Header                                       │
├─────────────────────────────────────────────┤
│ Recipe Metadata Form                        │
├─────────────────────────────────────────────┤
│ Draggable Resource List                     │
│ ┌─ [1] Resource Name    [⋮] [Configure] [×] │
│ ├─ [2] Resource Name    [⋮] [Configure] [×] │
│ └─ [3] Resource Name    [⋮] [Configure] [×] │
├─────────────────────────────────────────────┤
│ [Save Recipe] [Export YAML] [Clear All]     │
└─────────────────────────────────────────────┘
```

### User Dashboard
```
┌─────────────────────────────────────────────┐
│ Header                                       │
├─────────────────────────────────────────────┤
│ Welcome Back, [Username]                    │
├─────────────────────────────────────────────┤
│ Quick Stats  │  Recent Activity             │
│ • Claimed: 5 │  • New review on Resource X  │
│ • Reviews: 12│  • Resource Y was claimed     │
│ • Recipes: 3 │  • Recipe Z was downloaded    │
├─────────────────────────────────────────────┤
│ My Claimed Resources                        │
│ [Resource Card] [Resource Card]             │
├─────────────────────────────────────────────┤
│ My Recipes                                  │
│ [Recipe Card] [Recipe Card]                 │
└─────────────────────────────────────────────┘
```

## 4. Mobile Responsive Design

### Key Mobile Considerations
- **Stack layouts**: Convert side-by-side layouts to vertical stacks
- **Touch-friendly buttons**: Minimum 44px touch targets
- **Simplified navigation**: Hamburger menu for secondary nav
- **Queue floating button**: Fixed position add-to-recipe button
- **Swipe gestures**: For recipe reordering and review navigation

### Mobile Resource Card
```css
.resource-card {
  /* Desktop: 3 columns */
  @media (min-width: 1024px) {
    width: calc(33.333% - 20px);
  }
  
  /* Tablet: 2 columns */
  @media (min-width: 768px) and (max-width: 1023px) {
    width: calc(50% - 15px);
  }
  
  /* Mobile: 1 column */
  @media (max-width: 767px) {
    width: 100%;
    margin-bottom: 15px;
  }
}
```

## 5. State Management Architecture

### Redux Store Structure
```javascript
{
  auth: {
    user: User | null,
    loading: boolean,
    isAuthenticated: boolean
  },
  resources: {
    items: Resource[],
    filters: FilterState,
    pagination: PaginationState,
    loading: boolean
  },
  recipeBuilder: {
    queuedResources: QueuedResource[],
    metadata: RecipeMetadata,
    unsavedChanges: boolean
  },
  reviews: {
    [resourceId]: Review[]
  },
  ui: {
    sidebarOpen: boolean,
    modals: ModalState
  }
}
```

## 6. Key Interactions

### Resource Queue System
- **Add to queue**: Click button → Resource slides into queue sidebar
- **Queue indicator**: Header shows count + mini preview on hover
- **Drag to reorder**: In recipe builder, drag handles for install order
- **Quick remove**: X button with undo toast notification

### Review Interactions
- **Star rating**: Click to rate, hover for preview
- **Helpful voting**: Thumbs up/down with immediate feedback
- **Review filtering**: Sort by newest, most helpful, rating
- **Review responses**: Resource owners can respond to reviews

### Search & Discovery
- **Real-time search**: Debounced search with loading states
- **Filter persistence**: URL-based filter state for sharing
- **Infinite scroll**: Load more resources as user scrolls
- **Smart suggestions**: Search autocomplete for tags/categories
