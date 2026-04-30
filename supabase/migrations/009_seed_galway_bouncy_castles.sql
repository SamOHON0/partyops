-- Bulk-insert Galway Bouncy Castles inventory into PartyOps.
-- Business: Galway Bouncy Castles
-- Source of slugs: galwaybouncycastles.ie URL paths (must match for pre-fill to work).
--
-- Quantity defaults to 1 per castle. Adrian can update quantity_available later
-- in admin if he gets duplicates of any castle.
--
-- Image URLs hotlink to the live galwaybouncycastles.ie photos for now;
-- can be re-uploaded into PartyOps storage later if desired.
--
-- Idempotent: ON CONFLICT (business_id, slug) DO NOTHING means re-running this
-- migration will not duplicate existing rows.

insert into products
  (business_id, name, description, price_per_day, image_url, quantity_available, delivery_fee, slug)
values
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'The Eliminator High Slide Obstacle Course', 'Multiple challenge zones with a dramatic high slide finish. Perfect for older kids.', 300, 'https://www.galwaybouncycastles.ie/images/products/the-eliminator-high-slide-obstacle-course/hero.jpg', 1, 0, 'the-eliminator-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Army Boot Camp High Slide Obstacle Course', 'Military boot camp themed obstacle course with challenging sections and dramatic high slide.', 0, 'https://www.galwaybouncycastles.ie/images/products/army-boot-camp-high-slide-obstacle-course/hero.jpg', 1, 0, 'army-boot-camp-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Crocodile Dundee High Slide Obstacle Course', 'One of our most popular courses. Great for birthdays, communions and school events.', 280, 'https://www.galwaybouncycastles.ie/images/products/crocodile-dundee-high-slide-obstacle-course/hero.jpg', 1, 0, 'crocodile-dundee-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Jaws The Shark High Slide Obstacle Course', '45ft x 12ft. Enter through the mouth, face obstacles and tunnels, then tackle the 8.5ft slide.', 280, 'https://www.galwaybouncycastles.ie/images/products/jaws-the-shark-high-slide-obstacle-course/hero.jpg', 1, 0, 'jaws-the-shark-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Disco Clubhouse Obstacle Course', 'Premium disco-themed course with bouncing area, tunnels and disco zone.', 300, 'https://www.galwaybouncycastles.ie/images/products/disco-clubhouse-obstacle-course/hero.jpg', 1, 0, 'disco-clubhouse-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Lizzy the Lizard High Slide Obstacle Course', 'Colourful lizard-themed course with challenging sections and high slide.', 280, 'https://www.galwaybouncycastles.ie/images/products/lizzy-the-lizard-high-slide-obstacle-course/hero.jpg', 1, 0, 'lizzy-the-lizard-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Rainbow High Slide Obstacle Course', 'Bright rainbow-themed course with bouncing area, obstacles and high slide finish.', 0, 'https://www.galwaybouncycastles.ie/images/products/rainbow-high-slide-obstacle-course/hero.jpg', 1, 0, 'rainbow-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Army Combat High Slide Obstacle Course', 'Military-themed obstacle course. Brilliant for kids who love action.', 280, 'https://www.galwaybouncycastles.ie/images/products/army-combat-high-slide-obstacle-course/hero.jpg', 1, 0, 'army-combat-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Nuclear Danger High Slide Obstacle Course', 'Action-packed course with tunnels, ramps, bouncing areas and high slide.', 280, 'https://www.galwaybouncycastles.ie/images/products/nuclear-danger-high-slide-obstacle-course/hero.jpg', 1, 0, 'nuclear-danger-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Yellow Submarine High Slide Obstacle Course', 'Submarine-themed with slides, bish bash areas, tunnels and climbing walls.', 280, 'https://www.galwaybouncycastles.ie/images/products/yellow-submarine-high-slide-obstacle-course/hero.jpg', 1, 0, 'yellow-submarine-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Minnions High Slide Obstacle Course', 'Minions-themed course the kids absolutely love. Hours of bouncing fun.', 280, 'https://www.galwaybouncycastles.ie/images/products/minnions-high-slide-obstacle-course/hero.jpg', 1, 0, 'minnions-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Rockey the Tiger High Slide Obstacle Course', 'Tiger-themed course with multiple activity zones and high slide.', 280, 'https://www.galwaybouncycastles.ie/images/products/rockey-the-tiger-high-slide-obstacle-course/hero.jpg', 1, 0, 'rockey-the-tiger-high-slide-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'BOOSTER Adventure Run Obstacle Course', 'Fast-paced adventure run obstacle course. Perfect for younger kids and mid-size events.', 200, 'https://www.galwaybouncycastles.ie/images/products/booster-adventure-run-obstacle-course/hero.jpg', 1, 0, 'booster-adventure-run-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'ENERGY RUSH Obstacle Course', 'Compact course at a great price. Ideal for smaller gardens.', 200, 'https://www.galwaybouncycastles.ie/images/products/energy-rush-obstacle-course/hero.jpg', 1, 0, 'energy-rush-obstacle-course'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'CONGO The Gorilla High Slide', 'Dramatic gorilla-themed high slide. Perfect for older children.', 300, 'https://www.galwaybouncycastles.ie/images/products/congo-the-gorilla-high-slide/hero.jpg', 1, 0, 'congo-the-gorilla-high-slide'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Bouncy Castle & Slide Combo Units', 'Spacious bounce area with slide. Paw Patrol, Peppa Pig, Princess, LOL Dolls, John Deere. Rain cover included.', 200, 'https://www.galwaybouncycastles.ie/images/products/bouncy-castle-and-slide-combo-units/hero.jpg', 1, 0, 'bouncy-castle-and-slide-combo-units'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'Gazebo 4.5 Mtr x 3 Mtr', 'Compact gazebo for food areas or garden shade.', 0, 'https://www.galwaybouncycastles.ie/images/products/gazebo-45-mtr-x-3-mtr/hero.jpg', 1, 0, 'gazebo-45-mtr-x-3-mtr'),
  ('a12eb699-71ba-413c-b93d-01190296aa36'::uuid, 'PARTY MARQUEE 8x4 Mtr with White PVC', 'Weather backup and shade for outdoor events.', 0, 'https://www.galwaybouncycastles.ie/images/products/party-marquee-8x4-mtr-with-white-pvc/hero.jpg', 1, 0, 'party-marquee-8x4-mtr-with-white-pvc')
on conflict (business_id, slug) where slug is not null do nothing;
