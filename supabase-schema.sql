-- ============================================================
-- KR New Vision Enterprise — Supabase Database Schema
-- Run this in your Supabase SQL Editor
-- Project: krnewvision | ID: rcmccaiftwihjkehdprt
-- ============================================================

-- ============================================================
-- 1. SITE CONTENT TABLE
-- Stores all editable content: text, images, alignment, sizing
-- ============================================================
CREATE TABLE IF NOT EXISTS site_content (
  id            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  page          TEXT        NOT NULL,              -- e.g. 'index', 'about', 'author'
  section       TEXT        NOT NULL,              -- e.g. 'hero', 'cards', 'footer'
  key           TEXT        NOT NULL,              -- e.g. 'title', 'subtitle', 'image_url'
  value         TEXT,                              -- text content or full image URL
  type          TEXT        DEFAULT 'text',        -- 'text', 'image', 'html', 'button_text', 'button_link'
  align         TEXT        DEFAULT 'left',        -- 'left', 'center', 'right'
  image_width   TEXT        DEFAULT '100%',        -- e.g. '100%', '350px', '550px'
  image_height  TEXT        DEFAULT 'auto',        -- e.g. 'auto', '400px', '550px'
  object_fit    TEXT        DEFAULT 'contain',     -- 'contain', 'cover', 'fill', 'none'
  max_width     TEXT,                              -- e.g. '550px', '350px'
  max_height    TEXT,                              -- e.g. '550px', '420px'
  sort_order    INT         DEFAULT 0,
  updated_at    TIMESTAMPTZ DEFAULT now(),
  UNIQUE(page, section, key)
);

-- ============================================================
-- 2. ROW LEVEL SECURITY (RLS)
-- Public can READ, only authenticated admin can WRITE
-- ============================================================
ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read (public site reads content)
DROP POLICY IF EXISTS "Public read site_content" ON site_content;
CREATE POLICY "Public read site_content"
  ON site_content FOR SELECT
  USING (true);

-- Only authenticated users (admin) can insert/update/delete
DROP POLICY IF EXISTS "Admin insert site_content" ON site_content;
CREATE POLICY "Admin insert site_content"
  ON site_content FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin update site_content" ON site_content;
CREATE POLICY "Admin update site_content"
  ON site_content FOR UPDATE
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin delete site_content" ON site_content;
CREATE POLICY "Admin delete site_content"
  ON site_content FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- 3. AUTO-UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_site_content_updated_at ON site_content;
CREATE TRIGGER update_site_content_updated_at
  BEFORE UPDATE ON site_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 4. SEED INITIAL CONTENT — INDEX PAGE
-- ============================================================
INSERT INTO site_content (page, section, key, value, type) VALUES
  ('index', 'hero', 'title',         'Welcome to New Vision Enterprise', 'text'),
  ('index', 'hero', 'subtitle',      'This is not motivation. This is structure. New Vision Enterprise is the parent platform behind frameworks, content, and tools built for men navigating responsibility, pressure, and purpose - especially in the second half of life.', 'text'),
  ('index', 'hero', 'btn1_text',     'Learn More', 'text'),
  ('index', 'hero', 'btn1_link',     'about.html', 'text'),
  ('index', 'hero', 'btn2_text',     'Start Your Second Wind', 'text'),
  ('index', 'hero', 'btn2_link',     'monetization.html', 'text'),
  ('index', 'hero', 'image_url',     'pictures for web/308.png', 'image'),
  ('index', 'hero', 'tile_text',     'KR Henderson — Speaker. Author. Builder.', 'text'),
  ('index', 'ecosystem', 'title',    'The Ecosystem', 'text'),
  ('index', 'ecosystem', 'subtitle', 'New Vision Enterprise is the parent brand with Second Wind and WHOY under the umbrella.', 'text'),
  ('index', 'for_whom', 'title',     'Second Wind Is For:', 'text'),
  ('index', 'for_whom', 'subtitle',  'The men who feel behind, carry weight silently, rebuild after setbacks, and raise children later in life.', 'text'),
  ('index', 'meet_kr', 'title',      'Meet KR Henderson', 'text'),
  ('index', 'meet_kr', 'subtitle',   'Speaker. Author. Builder. KR Henderson is the founder of New Vision Enterprise and the voice behind the Second Wind movement and WHOY (Work Harder On Yourself). With a background in corporate leadership and real-life responsibility, he teaches structure that holds under pressure.', 'text'),
  ('index', 'meet_kr', 'quote',      '"Men do not need more motivation. They need systems that work when life does not."', 'text'),
  ('index', 'meet_kr', 'image_url',  'pictures for web/333.png', 'image'),
  ('index', 'banner', 'title',       'You are not late. You are assigned.', 'text'),
  ('index', 'banner', 'subtitle',    'Step into the system built for men who are done playing small.', 'text'),
  ('index', 'footer', 'left',        'New Vision Enterprise — KRNewVision.net', 'text'),
  ('index', 'footer', 'right',       'Structured for men navigating responsibility, pressure, and purpose.', 'text')
ON CONFLICT (page, section, key) DO NOTHING;

-- ============================================================
-- 5. SEED INITIAL CONTENT — ABOUT PAGE
-- ============================================================
INSERT INTO site_content (page, section, key, value, type) VALUES
  ('about', 'hero', 'title',         'About New Vision Enterprise', 'text'),
  ('about', 'hero', 'subtitle',      'New Vision Enterprise exists to help men transform their lives by developing a new vision for who they are, embracing their Second Wind, and working harder on themselves than they do on their circumstances.', 'text'),
  ('about', 'hero', 'image_url',     'logos/1514.png', 'image'),
  ('about', 'founder', 'title',      'The Founder', 'text'),
  ('about', 'founder', 'subtitle',   'KR Henderson is the Founder and Chief Development Officer of New Vision Enterprise, an educational and personal development company focused on leadership, growth, and transformation.', 'text'),
  ('about', 'founder', 'image_url',  'pictures for web/yourstory.png', 'image'),
  ('about', 'mission', 'title',      'Mission', 'text'),
  ('about', 'mission', 'quote',      '"To help men transform their lives by working harder on themselves than they do on their circumstances."', 'text'),
  ('about', 'vision', 'title',       'Vision', 'text'),
  ('about', 'vision', 'quote',       '"To create a generation of men who lead with responsibility, live with purpose, and never stop developing themselves."', 'text'),
  ('about', 'banner', 'title',       'Ready to Transform?', 'text'),
  ('about', 'banner', 'subtitle',    'Choose your path and get started today.', 'text')
ON CONFLICT (page, section, key) DO NOTHING;

-- ============================================================
-- 6. SEED INITIAL CONTENT — AUTHOR PAGE
-- ============================================================
INSERT INTO site_content (page, section, key, value, type) VALUES
  ('author', 'hero', 'title',        'Books by KR Henderson', 'text'),
  ('author', 'hero', 'subtitle',     'KR Henderson writes the same way he speaks: direct, practical, and built for application. No fluff. No theory. Just structure.', 'text'),
  ('author', 'hero', 'image_url',    'pictures for web/26.png', 'image'),
  ('author', 'books', 'title',       'Featured Titles', 'text'),
  ('author', 'books', 'subtitle',    'All books are available for sale on this website.', 'text'),
  ('author', 'book1', 'title',       'The Lion''s Den: 4 Pillars of Male Success', 'text'),
  ('author', 'book1', 'subtitle',    'Best Seller on Amazon — Leadership. Relationships. Health. Emotional resilience.', 'text'),
  ('author', 'book1', 'image_url',   'bookswritten/820.jpg', 'image'),
  ('author', 'book2', 'title',       'The Art of Personal Development - WHOY', 'text'),
  ('author', 'book2', 'subtitle',    'Work harder on yourself than anything around you.', 'text'),
  ('author', 'book2', 'image_url',   'bookswritten/whoy.png', 'image'),
  ('author', 'book3', 'title',       'Major Max Shorty: The Discovery Place', 'text'),
  ('author', 'book3', 'subtitle',    'Kids Book — A story about identity, discovery, and purpose.', 'text'),
  ('author', 'book3', 'image_url',   'bookswritten/73.png', 'image'),
  ('author', 'banner', 'title',      'Author Positioning', 'text'),
  ('author', 'banner', 'subtitle',   'Direct. Practical. Built for application.', 'text')
ON CONFLICT (page, section, key) DO NOTHING;

-- ============================================================
-- 7. SEED — SECOND WIND PAGE
-- ============================================================
INSERT INTO site_content (page, section, key, value, type) VALUES
  ('second-wind', 'hero', 'title',       'Your Second Wind Starts Here', 'text'),
  ('second-wind', 'hero', 'subtitle',    'This man has actually lived what he is teaching. Second Wind is for men who found purpose later, or accepted new assignments later. This is not about starting over. It is about recognizing that life unfolds in seasons.', 'text'),
  ('second-wind', 'hero', 'image_url',   'logos/secondwind.png', 'image'),
  ('second-wind', 'hero', 'tile_text',   'Second Shot. Late Purpose. Carrying More.', 'text'),
  ('second-wind', 'for_whom', 'title',   'Second Wind Is For:', 'text'),
  ('second-wind', 'for_whom', 'subtitle','The men who feel behind, carry weight silently, rebuild after re-assignment, and who have purpose later in life.', 'text'),
  ('second-wind', 'offers', 'title',     'What Second Wind Offers', 'text'),
  ('second-wind', 'banner', 'title',     'Ready for Your Second Wind?', 'text'),
  ('second-wind', 'banner', 'subtitle',  'The transformation starts with a single step.', 'text')
ON CONFLICT (page, section, key) DO NOTHING;

-- ============================================================
-- 8. SEED — WHOY PAGE
-- ============================================================
INSERT INTO site_content (page, section, key, value, type) VALUES
  ('whoy', 'hero', 'title',       'Work Harder On Yourself', 'text'),
  ('whoy', 'hero', 'subtitle',    'WHOY is a disciplined mindset built on personal responsibility, continuous growth, and intentional action. It teaches responsibility over excuses, structure over emotion, and execution over intention.', 'text'),
  ('whoy', 'hero', 'image_url',   'whoylogo/965.png', 'image'),
  ('whoy', 'hero', 'tile_text',   'Responsibility. Structure. Execution.', 'text'),
  ('whoy', 'principle', 'title',  'The WHOY Principle', 'text'),
  ('whoy', 'principle', 'subtitle','Work Harder On Yourself is the foundational philosophy behind all of our transformation programs.', 'text'),
  ('whoy', 'principle', 'image_url','pictures for web/333.png', 'image'),
  ('whoy', 'books', 'title',      'Books by KR Henderson', 'text'),
  ('whoy', 'offers', 'title',     'What WHOY Offers', 'text'),
  ('whoy', 'banner', 'title',     'Author Positioning', 'text'),
  ('whoy', 'banner', 'subtitle',  'Direct. Practical. Built for application.', 'text')
ON CONFLICT (page, section, key) DO NOTHING;

-- ============================================================
-- 9. SEED — WORK WITH KR PAGE
-- ============================================================
INSERT INTO site_content (page, section, key, value, type) VALUES
  ('work-with-kr', 'hero', 'title',       'Bring Transformation to Your Organization', 'text'),
  ('work-with-kr', 'hero', 'subtitle',    'KR Henderson works directly with organizations, teams, and individuals ready to implement real change. Whether it is a keynote, corporate training, or one-on-one coaching—the structure is the same: direct, practical, built for application.', 'text'),
  ('work-with-kr', 'hero', 'image_url',   'logos/674.png', 'image'),
  ('work-with-kr', 'hero', 'tile_text',   'Direct. Practical. Transformation.', 'text'),
  ('work-with-kr', 'services', 'title',   'Services', 'text'),
  ('work-with-kr', 'services', 'subtitle','Work with KR Henderson in the way that fits your needs and timeline.', 'text'),
  ('work-with-kr', 'why', 'title',        'Why Organizations Choose KR', 'text'),
  ('work-with-kr', 'why', 'image_url',    'pictures for web/219.png', 'image'),
  ('work-with-kr', 'process', 'title',    'The Booking Process', 'text'),
  ('work-with-kr', 'process', 'image_url','pictures for web/341.png', 'image'),
  ('work-with-kr', 'banner', 'title',     'Ready to Transform Your Team?', 'text'),
  ('work-with-kr', 'banner', 'subtitle',  'Let''s talk about what''s possible.', 'text')
ON CONFLICT (page, section, key) DO NOTHING;

-- ============================================================
-- 10. SEED — MONETIZATION PAGE
-- ============================================================
INSERT INTO site_content (page, section, key, value, type) VALUES
  ('monetization', 'hero', 'title',       'Structure You Can Act On.', 'text'),
  ('monetization', 'hero', 'subtitle',    'Practical tools, books, courses, and coaching designed to help you grow personally, lead effectively, and move forward with purpose.', 'text'),
  ('monetization', 'hero', 'image_url',   'pictures for web/942.png', 'image'),
  ('monetization', 'form', 'title',       'Event Information Form', 'text'),
  ('monetization', 'form', 'subtitle',    'Complete the form below to book KR Henderson for your event or to purchase products and services.', 'text'),
  ('monetization', 'products', 'title',   'Products & Services', 'text'),
  ('monetization', 'products', 'subtitle','Books, courses, and coaching packages available.', 'text'),
  ('monetization', 'banner', 'title',     'Start Your Second Wind', 'text'),
  ('monetization', 'banner', 'subtitle',  'Structure first. Execution next. Results after.', 'text')
ON CONFLICT (page, section, key) DO NOTHING;

-- ============================================================
-- 11. AUTOMATIC STORAGE BUCKET SETUP
-- Creates the "site-images" bucket and sets it to public
-- ============================================================

-- Create the bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-images', 'site-images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies for 'site-images'

-- 1. Allow public read access
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'site-images');

-- 2. Allow authenticated admin to upload/insert
DROP POLICY IF EXISTS "Auth Insert" ON storage.objects;
CREATE POLICY "Auth Insert" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'site-images' AND auth.role() = 'authenticated');

-- 3. Allow authenticated admin to update
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
CREATE POLICY "Auth Update" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

-- 4. Allow authenticated admin to delete
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
CREATE POLICY "Auth Delete" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'site-images' AND auth.role() = 'authenticated');

-- ============================================================
-- DONE! Your entire database and storage are ready.
-- ============================================================
