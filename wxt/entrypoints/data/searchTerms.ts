// Building blocks for natural-looking Bing queries. Queries are formed as
// "<lead-in> <topic>" or "<topic> <tail>" so they read like real searches a
// person would make (e.g. "best headphones", "gardening for beginners") rather
// than random word salad or gibberish strings.

// Query starters that pair naturally with a noun topic.
export const SEARCH_LEAD_INS: string[] = [
    'best', 'cheapest', 'affordable', 'popular', 'top 10', 'where to buy',
    'reviews of', 'benefits of', 'what is', 'history of', 'ideas for',
    'how much is', 'best budget', 'guide to', 'facts about', 'types of',
];

// Everyday subjects people actually search for.
export const SEARCH_TOPICS: string[] = [
    'coffee', 'espresso', 'pizza', 'sushi', 'tacos', 'ramen', 'breakfast',
    'smoothies', 'pasta', 'sourdough', 'chocolate', 'tea', 'restaurants',
    'gardening', 'houseplants', 'succulents', 'hiking', 'camping', 'kayaking',
    'running', 'cycling', 'swimming', 'yoga', 'pilates', 'meditation',
    'photography', 'painting', 'pottery', 'woodworking', 'knitting', 'origami',
    'guitar', 'piano', 'chess', 'board games', 'video games', 'puzzles',
    'movies', 'documentaries', 'podcasts', 'audiobooks', 'novels', 'comics',
    'astronomy', 'physics', 'biology', 'geography', 'history', 'languages',
    'budgeting', 'investing', 'productivity', 'nutrition', 'sleep', 'stretching',
    'marathons', 'tennis', 'basketball', 'soccer', 'skiing', 'surfing',
    'fishing', 'birdwatching', 'baking', 'cocktails', 'wine', 'cheese',
    'dogs', 'cats', 'aquariums', 'road trips', 'national parks', 'beaches',
    'mountains', 'waterfalls', 'museums', 'art galleries', 'concerts', 'festivals',
    'laptops', 'headphones', 'smartphones', 'cameras', 'keyboards', 'monitors',
    'standing desks', 'electric cars', 'solar panels', 'smart home', 'bicycles',
    'interior design', 'gardens', 'recipes', 'meal prep', 'houseplants',
];

// Suffixes that pair naturally with a noun topic.
export const SEARCH_TAILS: string[] = [
    'near me', 'for beginners', 'reviews', 'ideas', 'tips', 'prices',
    'on a budget', 'explained', 'guide', 'deals', 'this weekend', 'at home',
    'for kids', 'checklist', 'basics', 'trends',
];
