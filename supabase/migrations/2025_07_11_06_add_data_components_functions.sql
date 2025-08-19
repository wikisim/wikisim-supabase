
CREATE OR REPLACE FUNCTION insert_data_component(
    p_title text,
    p_description text,
    p_plain_title text,
    p_plain_description text,
    p_bytes_changed integer,

    p_owner_id uuid DEFAULT NULL, -- Optional owner ID for personal data

    p_comment text DEFAULT NULL,
    p_version_type data_component_version_type DEFAULT NULL,
    p_version_rolled_back_to integer DEFAULT NULL,

    p_label_ids integer[] DEFAULT NULL,

    p_input_value text DEFAULT NULL,
    p_result_value text DEFAULT NULL,
    p_value_type data_component_value_type DEFAULT NULL,
    p_value_number_display_type data_component_value_number_display_type DEFAULT NULL,
    p_value_number_sig_figs smallint DEFAULT NULL,
    p_datetime_range_start timestamptz DEFAULT NULL,
    p_datetime_range_end timestamptz DEFAULT NULL,
    p_datetime_repeat_every data_component_datetime_repeat_every DEFAULT NULL,
    p_units text DEFAULT NULL,
    p_dimension_ids text[] DEFAULT NULL,

    -- Optional field for test runs
    p_test_run_id text DEFAULT NULL,
    -- Optional id field for test runs, can only be negative
    p_id integer DEFAULT NULL
)
-- RETURNS data_components
RETURNS TABLE (
    id INTEGER,
    owner_id uuid,
    version_number INTEGER,
    editor_id uuid,
    created_at TIMESTAMPTZ,
    comment TEXT,
    bytes_changed INTEGER,
    version_type data_component_version_type,
    version_rolled_back_to INTEGER,
    title TEXT,
    description TEXT,
    label_ids INTEGER[],
    input_value TEXT,
    result_value TEXT,
    value_type data_component_value_type,
    value_number_display_type data_component_value_number_display_type,
    value_number_sig_figs SMALLINT,
    datetime_range_start TIMESTAMPTZ,
    datetime_range_end TIMESTAMPTZ,
    datetime_repeat_every data_component_datetime_repeat_every,
    units TEXT,
    dimension_ids TEXT[],
    plain_title TEXT,
    plain_description TEXT,
    test_run_id TEXT,
    warning_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    new_row data_components;
    converted_plain_text_result RECORD;
BEGIN
    IF auth.role() <> 'authenticated' THEN
        -- This check is essential in stopping a non-authenticated user because
        -- the `GRANT EXECUTE ... TO authenticated` does not work at this level.
        RAISE EXCEPTION 'ERR03. Must be authenticated';
    END IF;

    -- IF p_editor_id IS DISTINCT FROM auth.uid() THEN
    --     RAISE EXCEPTION 'ERR04. editor_id must match your user id';
    -- END IF;

    IF p_id IS NULL THEN
        p_id := nextval('data_components_id_seq'); -- Use sequence for new IDs
    ELSIF p_id >= 0 THEN
        RAISE EXCEPTION 'ERR05. p_id must be negative for test runs, got %', p_id;
    ELSIF p_test_run_id IS NULL THEN
        RAISE EXCEPTION 'ERR06. p_test_run_id must be provided for test runs with negative id of %, but got %', p_id, p_test_run_id;
    END IF;

    IF p_owner_id IS NOT NULL AND p_owner_id <> auth.uid() THEN
        RAISE EXCEPTION 'ERR10. owner_id must match your user id or be NULL';
    END IF;

    -- Call Edge Function to convert TipTap content to plain text
    SELECT * FROM internal_functions.calculate_plain_text(
        p_id,
        p_title,
        p_description,
        p_plain_title,
        p_plain_description
    ) INTO converted_plain_text_result;

    INSERT INTO data_components (
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
        plain_title,
        plain_description,
        test_run_id,
        id
    ) VALUES (
        p_owner_id,
        1, -- initial version number
        auth.uid(),
        p_comment,
        p_bytes_changed,
        p_version_type,
        p_version_rolled_back_to,
        p_title,
        p_description,
        p_label_ids,
        p_input_value,
        p_result_value,
        p_value_type,
        p_value_number_display_type,
        p_value_number_sig_figs,
        p_datetime_range_start,
        p_datetime_range_end,
        p_datetime_repeat_every,
        p_units,
        p_dimension_ids,
        converted_plain_text_result.plain_title, -- Server-side converted plain text
        converted_plain_text_result.plain_description -- Server-side converted plain text
        p_test_run_id,
        p_id
    ) RETURNING * INTO new_row;

    -- RETURN new_row;
    RETURN QUERY SELECT
        new_row.id,
        new_row.owner_id,
        new_row.version_number,
        new_row.editor_id,
        new_row.created_at,
        new_row.comment,
        new_row.bytes_changed,
        new_row.version_type,
        new_row.version_rolled_back_to,
        new_row.title,
        new_row.description,
        new_row.label_ids,
        new_row.input_value,
        new_row.result_value,
        new_row.value_type,
        new_row.value_number_display_type,
        new_row.value_number_sig_figs,
        new_row.datetime_range_start,
        new_row.datetime_range_end,
        new_row.datetime_repeat_every,
        new_row.units,
        new_row.dimension_ids,
        new_row.plain_title,
        new_row.plain_description,
        new_row.test_run_id,
        converted_plain_text_result.warning_message -- Include any warning message from Edge Function call
    ;
END;
$$;



CREATE OR REPLACE FUNCTION update_data_component(
    p_id integer,

    p_version_number integer,

    p_title text,
    p_description text,
    p_plain_title text,
    p_plain_description text,
    p_bytes_changed integer,

    p_comment text DEFAULT NULL,
    p_version_type data_component_version_type DEFAULT NULL,
    p_version_rolled_back_to integer DEFAULT NULL,

    p_label_ids integer[] DEFAULT NULL,

    p_input_value text DEFAULT NULL,
    p_result_value text DEFAULT NULL,
    p_value_type data_component_value_type DEFAULT NULL,
    p_value_number_display_type data_component_value_number_display_type DEFAULT NULL,
    p_value_number_sig_figs smallint DEFAULT NULL,
    p_datetime_range_start timestamptz DEFAULT NULL,
    p_datetime_range_end timestamptz DEFAULT NULL,
    p_datetime_repeat_every data_component_datetime_repeat_every DEFAULT NULL,
    p_units text DEFAULT NULL,
    p_dimension_ids text[] DEFAULT NULL

    -- Optional field for test runs should not be updatable
    -- p_test_run_id text DEFAULT NULL
)
-- RETURNS data_components
RETURNS TABLE (
    id INTEGER,
    owner_id uuid,
    version_number INTEGER,
    editor_id uuid,
    created_at TIMESTAMPTZ,
    comment TEXT,
    bytes_changed INTEGER,
    version_type data_component_version_type,
    version_rolled_back_to INTEGER,
    title TEXT,
    description TEXT,
    label_ids INTEGER[],
    input_value TEXT,
    result_value TEXT,
    value_type data_component_value_type,
    value_number_display_type data_component_value_number_display_type,
    value_number_sig_figs SMALLINT,
    datetime_range_start TIMESTAMPTZ,
    datetime_range_end TIMESTAMPTZ,
    datetime_repeat_every data_component_datetime_repeat_every,
    units TEXT,
    dimension_ids TEXT[],
    plain_title TEXT,
    plain_description TEXT,
    test_run_id TEXT,
    warning_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
    updated_row data_components;
    converted_plain_text_result RECORD;
BEGIN
    IF auth.role() <> 'authenticated' THEN
        -- This check is essential in stopping a non-authenticated user because
        -- the `GRANT EXECUTE ... TO authenticated` does not work at this level.
        RAISE EXCEPTION 'ERR07. Must be authenticated';
    END IF;

    -- IF p_editor_id IS DISTINCT FROM auth.uid() THEN
    --     RAISE EXCEPTION 'ERR08. editor_id must match your user id';
    -- END IF;

    -- Call Edge Function to convert TipTap content to plain text
    SELECT * FROM internal_functions.calculate_plain_text(
        p_id,
        p_title,
        p_description,
        p_plain_title,
        p_plain_description
    ) INTO converted_plain_text_result;

    UPDATE data_components
    SET
        version_number = p_version_number + 1,
        editor_id = auth.uid(),
        comment = p_comment,
        bytes_changed = p_bytes_changed,
        version_type = p_version_type,
        version_rolled_back_to = p_version_rolled_back_to,

        title = p_title,
        description = p_description,
        label_ids = p_label_ids,

        input_value = p_input_value,
        result_value = p_result_value,
        value_type = p_value_type,
        value_number_display_type = p_value_number_display_type,
        value_number_sig_figs = p_value_number_sig_figs,
        datetime_range_start = p_datetime_range_start,
        datetime_range_end = p_datetime_range_end,
        datetime_repeat_every = p_datetime_repeat_every,
        units = p_units,
        dimension_ids = p_dimension_ids,

        plain_title = converted_plain_text_result.plain_title, -- Server-side converted plain text
        plain_description = converted_plain_text_result.plain_description -- Server-side converted plain text
    WHERE (
        data_components.id = p_id AND data_components.version_number = p_version_number
        AND (
            data_components.owner_id = auth.uid() -- Ensure the owner is the editor
            OR data_components.owner_id IS NULL -- Allow updates if original owner_id is NULL, i.e. is a wiki component
        )
    )
    RETURNING * INTO updated_row;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'ERR09. Update failed: id % with version_number % not found or version mismatch.', p_id, p_version_number;
    END IF;

    RETURN QUERY SELECT
        updated_row.id,
        updated_row.owner_id,
        updated_row.version_number,
        updated_row.editor_id,
        updated_row.created_at,
        updated_row.comment,
        updated_row.bytes_changed,
        updated_row.version_type,
        updated_row.version_rolled_back_to,
        updated_row.title,
        updated_row.description,
        updated_row.label_ids,
        updated_row.input_value,
        updated_row.result_value,
        updated_row.value_type,
        updated_row.value_number_display_type,
        updated_row.value_number_sig_figs,
        updated_row.datetime_range_start,
        updated_row.datetime_range_end,
        updated_row.datetime_repeat_every,
        updated_row.units,
        updated_row.dimension_ids,
        updated_row.plain_title,
        updated_row.plain_description,
        updated_row.test_run_id,
        converted_plain_text_result.warning_message -- Include any warning message from Edge Function call
    ;
END;
$$;
