

-- Create secrets table
CREATE TABLE IF NOT EXISTS ws_private.app_secrets (
    id SERIAL PRIMARY KEY,
    key_name TEXT NOT NULL,
    secret_value TEXT NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
-- Enable RLS with NO policies (blocks all direct access)
ALTER TABLE ws_private.app_secrets ENABLE ROW LEVEL SECURITY;

-- Use the supabase web interface to create a new secret, e.g.
-- INSERT INTO ws_private.app_secrets (key_name) VALUES ('server_secret');
-- then update the edge function environment variable to match the generated
-- value and re-deploy them.
-- Then rename (or delete) the older server_secret from the secrets table to
-- invalidate it.



-- Helper function to get secrets, should only be callable from
CREATE OR REPLACE FUNCTION ws_private.get_app_secret(p_key_name TEXT)
RETURNS SETOF TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    row_record RECORD;
    found BOOLEAN := FALSE;
BEGIN
    FOR row_record IN
        SELECT secret_value
        FROM ws_private.app_secrets
        WHERE key_name = p_key_name
    LOOP
        found := TRUE;
        RETURN NEXT row_record.secret_value;
    END LOOP;

    IF NOT found THEN
        RAISE EXCEPTION 'ERR25. No secrets found for key_name: %', p_key_name;
    END IF;
END;
$$;



-- Create a composite type for bulk insert parameters
CREATE TYPE public.data_component_insert_params AS (
    p_title text,
    p_description text,
    p_plain_title text,  -- Will have been prepared by the edge function
    p_plain_description text,  -- Will have been prepared by the edge function
    p_bytes_changed integer,

    p_owner_id uuid, -- Optional owner ID for personal data

    p_comment text,
    p_version_type data_component_version_type,
    p_version_rolled_back_to integer,

    p_label_ids integer[],

    p_input_value text,
    p_result_value text,
    p_value_type data_component_value_type,
    p_value_number_display_type data_component_value_number_display_type,
    p_value_number_sig_figs smallint,
    p_datetime_range_start timestamptz,
    p_datetime_range_end timestamptz,
    p_datetime_repeat_every data_component_datetime_repeat_every,
    p_units text,
    p_dimension_ids text[],
    p_function_arguments JSONB,
    p_scenarios JSONB,

    -- Optional field for test runs
    p_test_run_id text,
    -- Optional id field for test runs, can only be negative
    p_id integer
);


-- This function is in the public schema but it is protected from invocation
-- from the javacript client by checking the server_secret parameter. The server
-- secret is stored in the ws_private.app_secrets table and should be
-- stored by the edge function and passed to this function.
CREATE OR REPLACE FUNCTION public.insert_data_component_v2(
    server_secret text,
    components public.data_component_insert_params[]
)
RETURNS SETOF public.data_components
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    component public.data_component_insert_params;
    new_row public.data_components;
BEGIN
    IF server_secret IS NULL OR NOT (server_secret IN (SELECT ws_private.get_app_secret('server_secret'))) THEN
        RAISE EXCEPTION 'ERR14. Invalid server secret';
    END IF;

    IF auth.role() <> 'authenticated' THEN
        -- This check is essential in stopping a non-authenticated user because
        -- the `GRANT EXECUTE ... TO authenticated` does not work at this level.
        RAISE EXCEPTION 'ERR03.v2. Must be authenticated';
    END IF;

    -- Loop through each component and insert
    FOREACH component IN ARRAY components
    LOOP

        IF component.p_owner_id IS NOT NULL AND component.p_owner_id <> auth.uid() THEN
            RAISE EXCEPTION 'ERR10.v2. owner_id must match your user id or be NULL';
        END IF;

        IF component.p_id IS NULL THEN
            component.p_id := nextval('data_components_id_seq'); -- Use sequence for new IDs
        ELSIF component.p_id >= 0 THEN
            RAISE EXCEPTION 'ERR05.v2. p_id must be negative for test runs, got %', component.p_id;
        ELSIF component.p_id < -20 THEN
            RAISE EXCEPTION 'ERR13.v2. p_id must be negative for test runs but no smaller than -20, got %', component.p_id;
        ELSIF component.p_test_run_id IS NULL THEN
            RAISE EXCEPTION 'ERR06.v2. p_test_run_id must be provided for test runs with negative id of %, but got %', component.p_id, component.p_test_run_id;
        END IF;


        INSERT INTO public.data_components (
            owner_id,
            version_number,
            editor_id,
            comment,
            bytes_changed,
            version_type,
            version_rolled_back_to,
            title,
            description,
            label_ids,
            input_value,
            result_value,
            value_type,
            value_number_display_type,
            value_number_sig_figs,
            datetime_range_start,
            datetime_range_end,
            datetime_repeat_every,
            units,
            dimension_ids,
            function_arguments,
            scenarios,
            plain_title,
            plain_description,
            test_run_id,
            id
        ) VALUES (
            component.p_owner_id,
            1, -- initial version number
            auth.uid(),
            component.p_comment,
            component.p_bytes_changed,
            component.p_version_type,
            component.p_version_rolled_back_to,
            component.p_title,
            component.p_description,
            component.p_label_ids,
            component.p_input_value,
            component.p_result_value,
            component.p_value_type,
            component.p_value_number_display_type,
            component.p_value_number_sig_figs,
            component.p_datetime_range_start,
            component.p_datetime_range_end,
            component.p_datetime_repeat_every,
            component.p_units,
            component.p_dimension_ids,
            component.p_function_arguments,
            component.p_scenarios,
            component.p_plain_title,
            component.p_plain_description,
            component.p_test_run_id,
            component.p_id
        ) RETURNING * INTO new_row;

        RETURN NEXT new_row;
    END LOOP;
END;
$$;







-- Create a composite type for bulk update parameters
CREATE TYPE public.data_component_update_params AS (
    p_id integer,

    p_version_number integer,

    p_title text,
    p_description text,
    p_plain_title text,  -- Will have been prepared by the edge function
    p_plain_description text,  -- Will have been prepared by the edge function
    p_bytes_changed integer,

    -- Do not inlude owner_id as this should never be changed via
    -- this function -- p_owner_id uuid

    p_comment text,
    p_version_type data_component_version_type,
    p_version_rolled_back_to integer,

    p_label_ids integer[],

    p_input_value text,
    p_result_value text,
    p_value_type data_component_value_type,
    p_value_number_display_type data_component_value_number_display_type,
    p_value_number_sig_figs smallint,
    p_datetime_range_start timestamptz,
    p_datetime_range_end timestamptz,
    p_datetime_repeat_every data_component_datetime_repeat_every,
    p_units text,
    p_dimension_ids text[],
    p_function_arguments JSONB,
    p_scenarios JSONB

    -- Optional field for test runs should not be updatable
    -- p_test_run_id text,
);


-- This function is in the public schema but it is protected from invocation
-- from the javacript client by checking the server_secret parameter. The server
-- secret is stored in the ws_private.app_secrets table and should be
-- stored by the edge function and passed to this function.
CREATE OR REPLACE FUNCTION public.update_data_component_v2(
    server_secret text,
    components public.data_component_update_params[]
)
RETURNS SETOF public.data_components
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    component public.data_component_update_params;
    updated_row public.data_components;
BEGIN
    IF server_secret IS NULL OR NOT (server_secret IN (SELECT ws_private.get_app_secret('server_secret'))) THEN
        RAISE EXCEPTION 'ERR21. Invalid server secret';
    END IF;

    IF auth.role() <> 'authenticated' THEN
        -- This check is essential in stopping a non-authenticated user because
        -- the `GRANT EXECUTE ... TO authenticated` does not work at this level.
        RAISE EXCEPTION 'ERR07.v2. Must be authenticated';
    END IF;

    -- Loop through each component and update
    FOREACH component IN ARRAY components
    LOOP

        UPDATE public.data_components
        SET
            version_number = component.p_version_number + 1,
            editor_id = auth.uid(),
            comment = component.p_comment,
            bytes_changed = component.p_bytes_changed,
            version_type = component.p_version_type,
            version_rolled_back_to = component.p_version_rolled_back_to,

            title = component.p_title,
            description = component.p_description,
            label_ids = component.p_label_ids,

            input_value = component.p_input_value,
            result_value = component.p_result_value,
            value_type = component.p_value_type,
            value_number_display_type = component.p_value_number_display_type,
            value_number_sig_figs = component.p_value_number_sig_figs,
            datetime_range_start = component.p_datetime_range_start,
            datetime_range_end = component.p_datetime_range_end,
            datetime_repeat_every = component.p_datetime_repeat_every,
            units = component.p_units,
            dimension_ids = component.p_dimension_ids,
            function_arguments = component.p_function_arguments,
            scenarios = component.p_scenarios,

            plain_title = component.p_plain_title, -- Server-side converted plain text
            plain_description = component.p_plain_description -- Server-side converted plain text
        WHERE (
            data_components.id = component.p_id AND data_components.version_number = component.p_version_number
            AND (
                data_components.owner_id = auth.uid() -- Ensure the owner is the editor
                OR data_components.owner_id IS NULL -- Allow updates if original owner_id is NULL, i.e. is a wiki component
            )
        )
        RETURNING * INTO updated_row;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'ERR09.v2. Update failed: id % with version_number % not found or version mismatch, or owner_id editor_id mismatch.', component.p_id, component.p_version_number;
        END IF;

        RETURN NEXT updated_row;
    END LOOP;
END;
$$;
