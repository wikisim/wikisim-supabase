
-- TODO remove this once we have improved integration test to allow logging in/out
-- with different users.
CREATE OR REPLACE FUNCTION __testing_insert_test_data_component(
    p_id INTEGER,
    p_test_run_id TEXT
)
RETURNS data_components
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_row data_components;
BEGIN
    IF auth.role() <> 'authenticated' THEN
        -- This check is essential in stopping a non-authenticated user because
        -- the `GRANT EXECUTE ... TO authenticated` does not work at this level.
        RAISE EXCEPTION 'ERR07. Must be authenticated';
    END IF;

    IF p_id IS NULL OR p_test_run_id IS NULL THEN
        RAISE EXCEPTION 'Must provide p_id and p_test_run_id';
    END IF;

    IF p_id >= 0 THEN
        RAISE EXCEPTION 'Must give negative id for test data';
    END IF;

    INSERT INTO data_components (
        id,
        owner_id,
        version_number,
        editor_id,
        bytes_changed,
        title,
        description,
        plain_title,
        plain_description,
        test_run_id
    ) VALUES (
        p_id,
        -- Hard code to AJPtest2 user id
        'c3b9d96b-dc5c-4f5f-9698-32eaf601b7f2',
        1, -- initial version number
        auth.uid(),
        0,
        '',
        '',
        '',
        '',
        p_test_run_id
    ) RETURNING * INTO new_row;

    RETURN new_row;
END;
$$;
