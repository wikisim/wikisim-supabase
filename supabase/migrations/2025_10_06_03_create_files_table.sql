

-- We're not using the owner or owner_id fields of storage.objects at the moment
-- but we want to set them on the upload to ensure that we have a record of
-- who was the first user to upload what, though we probably want to REMOVE THIS
-- functionality and replace with a record of all upload attempts (because
-- subsequent uploads of the same file by different users might need to be
-- tracked too).
CREATE OR REPLACE FUNCTION public.set_owner_of_file(
    server_secret text,
    file_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF server_secret IS NULL OR NOT (server_secret IN (SELECT ws_private.get_app_secret('server_secret'))) THEN
        RAISE EXCEPTION 'ERR14. Invalid server secret';
    END IF;

    IF auth.role() <> 'authenticated' THEN
        -- This check is essential in stopping a non-authenticated user because
        -- the `GRANT EXECUTE ... TO authenticated` does not work at this level.
        RAISE EXCEPTION 'ERR03.set_owner_of_file. Must be authenticated';
    END IF;

    UPDATE storage.objects
    SET
        owner = auth.uid(),
        owner_id = auth.uid()  -- for compatibility with older versions of supabase
    WHERE id = file_id AND owner IS NULL;
END;
$$;


--------------------------------------------------------------------------------


CREATE TABLE public.public_storage_files_metadata
(
    file_id uuid NOT NULL PRIMARY KEY REFERENCES storage.objects(id) ON DELETE CASCADE,
    file_hash_filename text NOT NULL, -- sha256 hash of the file at time of insertion
    allowed boolean NOT NULL DEFAULT true -- whether the file is allowed to be served
);

-- Locking down access to only admin via RLS with no policies
alter table public.public_storage_files_metadata enable row level security;
CREATE POLICY "Anyone can read"
    ON public.public_storage_files_metadata FOR SELECT USING (true);



-- Trigger to insert into public.public_storage_files_metadata
-- on insert of storage.objects
-- with file_hash_filename set to storage.objects.name
CREATE OR REPLACE FUNCTION ws_private.sync_private_storage_objects_to_public_storage_files_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.public_storage_files_metadata (file_id, file_hash_filename)
    VALUES (NEW.id, NEW.name)
    ON CONFLICT (file_id) DO NOTHING;  -- Do nothing if already exists

    RETURN NEW;
END;
$$;

CREATE TRIGGER sync_private_storage_objects_to_public_storage_files_metadata_trigger
AFTER INSERT ON storage.objects
FOR EACH ROW
EXECUTE FUNCTION ws_private.sync_private_storage_objects_to_public_storage_files_metadata();



--------------------------------------------------------------------------------


-- row level security is already enabled by supabase and can't be changed
-- alter table storage.objects enable row level security;

-- Allow read access to storage.objects only if:
--  storage.objects.id === public_storage_files_metadata.file_id
--  and allowed = true
CREATE POLICY "Anyone can read from storage.objects if allowed is true"
ON storage.objects
FOR SELECT
USING (
    EXISTS (
        SELECT 1
        FROM public.public_storage_files_metadata
        WHERE public.public_storage_files_metadata.file_id = id
          AND public.public_storage_files_metadata.allowed = true
    )
);


--------------------------------------------------------------------------------


CREATE TABLE ws_private.storage_files_metadata
(
    file_id uuid NOT NULL PRIMARY KEY REFERENCES storage.objects(id) ON DELETE CASCADE,
    allowed boolean NOT NULL, -- whether the file is allowed to be served
    created_at timestamp with time zone default now(),
    updated_at timestamp with time zone default now(),
    set_by_user_id uuid NOT NULL,
    comment text,

    CONSTRAINT storage_files_metadata_set_by_user_id_fk FOREIGN KEY (set_by_user_id) REFERENCES auth.users(id)
);

-- Locking down access to only admin via RLS with no policies
alter table ws_private.storage_files_metadata enable row level security;
CREATE POLICY "Allow service_role only"
    ON ws_private.storage_files_metadata FOR ALL TO service_role USING (true);



-- Trigger to set updated_at on insert or update
CREATE OR REPLACE FUNCTION ws_private.set_storage_files_metadata_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    NEW.updated_at := now();
    RETURN NEW;
END;
$$;

CREATE TRIGGER storage_files_metadata_set_updated_at_trigger
BEFORE INSERT OR UPDATE ON ws_private.storage_files_metadata
FOR EACH ROW
EXECUTE FUNCTION ws_private.set_storage_files_metadata_updated_at();



-- Trigger to sync to public.public_storage_files_metadata
-- on insert or update of ws_private.storage_files_metadata
CREATE OR REPLACE FUNCTION ws_private.sync_private_to_public_storage_files_metadata()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.public_storage_files_metadata (file_id, allowed)
    VALUES (NEW.file_id, NEW.allowed)
    ON CONFLICT (file_id) DO UPDATE
    SET allowed = EXCLUDED.allowed;  -- Set allowed to the new value

    RETURN NEW;
END;
$$;

CREATE TRIGGER sync_private_to_public_storage_files_metadata_trigger
AFTER INSERT OR UPDATE ON ws_private.storage_files_metadata
FOR EACH ROW
EXECUTE FUNCTION ws_private.sync_private_to_public_storage_files_metadata();
