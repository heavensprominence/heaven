-- Fix categories on VPS
DELETE FROM category_translations;
DELETE FROM shop_categories;

INSERT INTO shop_categories (slug, name, icon, is_active, sort_order) VALUES
('electronics', 'Electronics', '📱', true, 1),
('clothing', 'Clothing', '👕', true, 2),
('home', 'Home & Garden', '🏠', true, 3),
('books', 'Books & Media', '📚', true, 4),
('vehicles', 'Vehicles', '🚗', true, 5),
('collectibles', 'Collectibles', '💎', true, 6),
('other', 'Other', '📦', true, 7);

-- Add subcategories
INSERT INTO shop_categories (slug, name, parent_category, is_active, sort_order) VALUES
('electronics_other', 'Other', 'electronics', true, 1),
('clothing_other', 'Other', 'clothing', true, 1),
('home_other', 'Other', 'home', true, 1),
('books_other', 'Other', 'books', true, 1),
('vehicles_other', 'Other', 'vehicles', true, 1),
('collectibles_other', 'Other', 'collectibles', true, 1);

-- Translations for main categories (English)
INSERT INTO category_translations (category, language_code, name) VALUES
('electronics', 'en', 'Electronics'),
('clothing', 'en', 'Clothing'),
('home', 'en', 'Home & Garden'),
('books', 'en', 'Books & Media'),
('vehicles', 'en', 'Vehicles'),
('collectibles', 'en', 'Collectibles'),
('other', 'en', 'Other');
