-- HeavensLive — Category Seed Data
-- Run: psql -U heavenslive -d heavenslive_db -f seed-categories.sql

INSERT INTO shop_categories (category, display_name, parent_category, icon, level, full_path, is_active) VALUES
('electronics', 'Electronics', NULL, '📱', 1, 'electronics', true),
('fashion', 'Clothing & Fashion', NULL, '👕', 1, 'fashion', true),
('home_garden', 'Home & Garden', NULL, '🏡', 1, 'home_garden', true),
('books_media', 'Books & Media', NULL, '📚', 1, 'books_media', true),
('collectibles_art', 'Collectibles & Art', NULL, '🎨', 1, 'collectibles_art', true),
('sports_outdoors', 'Sports & Outdoors', NULL, '⚽', 1, 'sports_outdoors', true),
('toys_games', 'Toys & Games', NULL, '🎮', 1, 'toys_games', true),
('health_beauty', 'Health & Beauty', NULL, '💄', 1, 'health_beauty', true),
('automotive', 'Automotive', NULL, '🚗', 1, 'automotive', true),
('food_drinks', 'Food & Drinks', NULL, '🍔', 1, 'food_drinks', true),
('services', 'Services', NULL, '🔧', 1, 'services', true),
('spiritual', 'Spiritual & Religious', NULL, '🕊️', 1, 'spiritual', true),
('other', 'Other', NULL, '📦', 1, 'other', true)
ON CONFLICT (category) DO NOTHING;

-- Subcategories
INSERT INTO shop_categories (category, display_name, parent_category, icon, level, full_path, is_active) VALUES
('electronics_phones', 'Phones & Accessories', 'electronics', '📲', 2, 'electronics/phones', true),
('electronics_computers', 'Computers & Laptops', 'electronics', '💻', 2, 'electronics/computers', true),
('electronics_audio', 'Audio & Headphones', 'electronics', '🎧', 2, 'electronics/audio', true),
('electronics_cameras', 'Cameras & Photo', 'electronics', '📷', 2, 'electronics/cameras', true),
('electronics_gaming', 'Gaming Consoles', 'electronics', '🕹️', 2, 'electronics/gaming', true),
('electronics_other', 'Other', 'electronics', '📦', 2, 'electronics/other', true),

('fashion_men', 'Men''s Clothing', 'fashion', '👔', 2, 'fashion/men', true),
('fashion_women', 'Women''s Clothing', 'fashion', '👗', 2, 'fashion/women', true),
('fashion_shoes', 'Shoes', 'fashion', '👟', 2, 'fashion/shoes', true),
('fashion_accessories', 'Accessories', 'fashion', '👜', 2, 'fashion/accessories', true),
('fashion_jewelry', 'Jewelry', 'fashion', '💍', 2, 'fashion/jewelry', true),
('fashion_other', 'Other', 'fashion', '📦', 2, 'fashion/other', true),

('home_furniture', 'Furniture', 'home_garden', '🪑', 2, 'home_garden/furniture', true),
('home_decor', 'Home Decor', 'home_garden', '🖼️', 2, 'home_garden/decor', true),
('home_kitchen', 'Kitchen & Dining', 'home_garden', '🍳', 2, 'home_garden/kitchen', true),
('home_garden_tools', 'Garden Tools', 'home_garden', '🌿', 2, 'home_garden/tools', true),
('home_other', 'Other', 'home_garden', '📦', 2, 'home_garden/other', true),

('books_fiction', 'Fiction', 'books_media', '📖', 2, 'books_media/fiction', true),
('books_nonfiction', 'Non-Fiction', 'books_media', '📘', 2, 'books_media/nonfiction', true),
('books_music', 'Music & Instruments', 'books_media', '🎵', 2, 'books_media/music', true),
('books_other', 'Other', 'books_media', '📦', 2, 'books_media/other', true),

('art_paintings', 'Paintings', 'collectibles_art', '🖌️', 2, 'collectibles_art/paintings', true),
('art_sculpture', 'Sculpture', 'collectibles_art', '🗿', 2, 'collectibles_art/sculpture', true),
('art_coins', 'Coins & Stamps', 'collectibles_art', '🪙', 2, 'collectibles_art/coins', true),
('art_other', 'Other', 'collectibles_art', '📦', 2, 'collectibles_art/other', true),

('sports_fitness', 'Fitness Equipment', 'sports_outdoors', '🏋️', 2, 'sports_outdoors/fitness', true),
('sports_camping', 'Camping & Hiking', 'sports_outdoors', '🏕️', 2, 'sports_outdoors/camping', true),
('sports_bikes', 'Bikes & Cycling', 'sports_outdoors', '🚲', 2, 'sports_outdoors/bikes', true),
('sports_other', 'Other', 'sports_outdoors', '📦', 2, 'sports_outdoors/other', true),

('toys_action', 'Action Figures', 'toys_games', '🦸', 2, 'toys_games/action', true),
('toys_board', 'Board Games', 'toys_games', '🎲', 2, 'toys_games/board', true),
('toys_video', 'Video Games', 'toys_games', '🎮', 2, 'toys_games/video', true),
('toys_other', 'Other', 'toys_games', '📦', 2, 'toys_games/other', true),

('health_skincare', 'Skincare', 'health_beauty', '🧴', 2, 'health_beauty/skincare', true),
('health_makeup', 'Makeup', 'health_beauty', '💋', 2, 'health_beauty/makeup', true),
('health_wellness', 'Wellness', 'health_beauty', '🧘', 2, 'health_beauty/wellness', true),
('health_other', 'Other', 'health_beauty', '📦', 2, 'health_beauty/other', true),

('auto_parts', 'Parts & Accessories', 'automotive', '🔩', 2, 'automotive/parts', true),
('auto_tools', 'Tools & Equipment', 'automotive', '🔧', 2, 'automotive/tools', true),
('auto_other', 'Other', 'automotive', '📦', 2, 'automotive/other', true),

('food_gourmet', 'Gourmet & Specialty', 'food_drinks', '🍷', 2, 'food_drinks/gourmet', true),
('food_beverages', 'Beverages', 'food_drinks', '🥤', 2, 'food_drinks/beverages', true),
('food_other', 'Other', 'food_drinks', '📦', 2, 'food_drinks/other', true),

('services_digital', 'Digital Services', 'services', '🌐', 2, 'services/digital', true),
('services_home', 'Home Services', 'services', '🏠', 2, 'services/home', true),
('services_lessons', 'Lessons & Tutoring', 'services', '📝', 2, 'services/lessons', true),
('services_other', 'Other', 'services', '📦', 2, 'services/other', true),

('spiritual_books', 'Sacred Texts', 'spiritual', '📜', 2, 'spiritual/books', true),
('spiritual_items', 'Devotional Items', 'spiritual', '📿', 2, 'spiritual/items', true),
('spiritual_other', 'Other', 'spiritual', '📦', 2, 'spiritual/other', true)
ON CONFLICT (category) DO NOTHING;

-- Rebuild paths
SELECT public.rebuild_category_paths();
