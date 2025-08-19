CREATE SCHEMA IF NOT EXISTS internal_functions;


CREATE OR REPLACE FUNCTION internal_functions.get_edge_function_base_url()
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = 'public'
AS $$
    SELECT 'https://sfkgqscbwofiphfxhnxg.supabase.co/functions/v1';
$$;


CREATE OR REPLACE FUNCTION internal_functions.get_supabase_public_anon_key()
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = 'public'
AS $$
    SELECT 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzMjA2MTkwNSwiZXhwIjoxOTQ3NjM3OTA1fQ.or3FBQDa4CtAA8w7XQtYl_3NTmtFFYPWoafolOpPKgA';
$$;


CREATE SCHEMA IF NOT EXISTS extension_http;
GRANT USAGE ON SCHEMA extension_http TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA extension_http TO authenticated;
-- Enable the http extension for making HTTP requests from PostgreSQL
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extension_http;



CREATE OR REPLACE FUNCTION internal_functions.calculate_plain_text(
    p_id integer,
    p_title text,
    p_description text,
    p_plain_title text,
    p_plain_description text
)
RETURNS TABLE (
    id integer,
    plain_title text,
    plain_description text,
    warning_message text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'internal_functions'
AS $$
DECLARE
    edge_function_url text;
    http_response record;
    conversion_response jsonb;
    converted_plain_title text := p_plain_title;
    converted_plain_description text := p_plain_description;
    warning_message text := NULL;
BEGIN

    -- Call Edge Function to convert TipTap content to plain text
    BEGIN
        -- Get the Edge Function URL
        edge_function_url := internal_functions.get_edge_function_base_url() || '/compute_field_values';

        -- Set a default timeout for HTTP requests to prevent long waits.
        SET extension_http.http.curlopt_timeout_msec = 500;

        -- Make HTTP request to Edge Function
        -- I don't like doing this in a transaction because I assume this will
        -- tie up DB resources and block other inserts whilst it waits for the
        -- Edge Function to respond.
        SELECT * FROM extension_http.http((
            'POST',
            edge_function_url,
            ARRAY[
                extension_http.http_header('Authorization', 'Bearer ' || internal_functions.get_supabase_public_anon_key())
            ],
            'application/json',
            jsonb_build_object(
                'batch', jsonb_build_array(
                    jsonb_build_object(
                        'id', p_id,
                        'title', p_title,
                        'description', p_description
                    )
                )
            )::text
        )::extension_http.http_request) INTO http_response;

        -- Parse the response
        IF http_response.status = 200 THEN
            conversion_response := http_response.content::jsonb;

            -- Extract converted plain text
            converted_plain_title := COALESCE(
                (conversion_response->'results'->0->>'plain_title'),
                ''
            );
            converted_plain_description := COALESCE(
                (conversion_response->'results'->0->>'plain_description'),
                ''
            );
        ELSE
            -- Log the error but don't fail the insert
            warning_message := format(
                'Edge Function compute_field_values call failed with status %s. Using plain text fields from client. Error content: %s',
                http_response.status,
                http_response.content
            );
            RAISE WARNING '%', warning_message;
        END IF;

    EXCEPTION WHEN OTHERS THEN
        -- If Edge Function fails, log warning and continue with empty plain text
        warning_message := format('Failed to call Edge Function compute_field_values for TipTap conversion: %s. Using plain text fields from client.', SQLERRM);
        RAISE WARNING '%', warning_message;
    END;

    -- Return the converted plain text
    RETURN QUERY SELECT
        p_id as id,
        converted_plain_title AS plain_title,
        converted_plain_description AS plain_description,
        warning_message;
END;
$$;
