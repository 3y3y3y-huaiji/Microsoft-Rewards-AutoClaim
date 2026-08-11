// Building blocks for natural-looking Bing queries. Queries are formed as
// "<lead-in> <topic>" or "<topic> <tail>" so they read like real searches a
// person would make (e.g. "best headphones", "gardening for beginners") rather
// than random word salad or gibberish strings.

// Query starters that pair naturally with a noun topic.
export const SEARCH_LEAD_INS: string[] = [
    'best', 'cheapest', 'affordable', 'popular', 'top 10', 'where to buy',
    'reviews of', 'benefits of', 'what is', 'history of', 'ideas for',
    'how much is', 'best budget', 'guide to', 'facts about', 'types of',
    '最佳', '热门', '性价比最高', '十大', '哪里买', '评测', '好处', '什么是',
    '历史', '推荐', '指南', '介绍', '教程', '常见',
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
    '咖啡', '披萨', '寿司', '拉面', '早餐', '绿茶', '园艺', '多肉植物', '徒步', '露营',
    '跑步', '游泳', '瑜伽', '冥想', '摄影', '油画', '陶艺', '木工', '吉他', '钢琴',
    '围棋', '桌游', '电子游戏', '电影', '纪录片', '小说', '漫画', '天文', '物理', '生物',
    '历史', '语言', '理财', '投资', '工作效率', '健康饮食', '睡眠', '马拉松', '网球', '篮球',
    '足球', '滑雪', '冲浪', '钓鱼', '狗狗', '猫咪', '水族箱', '自驾游', '国家公园', '海滩',
    '博物馆', '美术馆', '音乐会', '笔记本电脑', '蓝牙耳机', '智能手机', '相机', '机械键盘', '显示器', '升降桌',
    '新能源汽车', '太阳能', '智能家居', '自行车', '室内设计', '菜谱', '健身',
];

// Suffixes that pair naturally with a noun topic.
export const SEARCH_TAILS: string[] = [
    'near me', 'for beginners', 'reviews', 'ideas', 'tips', 'prices',
    'on a budget', 'explained', 'guide', 'deals', 'this weekend', 'at home',
    'for kids', 'checklist', 'basics', 'trends',
    '附近', '入门', '评测', '技巧', '价格', '优惠', '在家', '适合新手', '清单', '趋势', '推荐',
];
