-- Create a public storage bucket for product images
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, ARRAY['image/webp', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Users can only upload to their own folder (auth.uid() prefix)
drop policy if exists "Users can upload to own folder" on storage.objects;
create policy "Users can upload to own folder"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only update their own images
drop policy if exists "Users can update own images" on storage.objects;
create policy "Users can update own images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Users can only delete their own images
drop policy if exists "Users can delete own images" on storage.objects;
create policy "Users can delete own images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- Anyone can view product images (needed for public widget)
drop policy if exists "Anyone can view product images" on storage.objects;
create policy "Anyone can view product images"
on storage.objects for select
to public
using (bucket_id = 'product-images');
