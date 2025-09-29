
-- This is public so that it will be added to interface.ts and more easily used
-- in API calls
CREATE TYPE public.search_data_components_order_by AS ENUM (
    'score',
    'created_at DESC',
    'created_at ASC'
);

-- This is public so that it will be added to interface.ts and more easily used
-- in API calls
CREATE TYPE public.search_data_components_filter_by_wiki_or_owned AS ENUM (
    'wiki',
    'owned'
);


CREATE OR REPLACE FUNCTION public.search_data_components(
    query TEXT,
    similarity_threshold FLOAT DEFAULT 0.2,
    limit_n INT DEFAULT 20,
    offset_n INT DEFAULT 0,
    -- Not implemented yet
    order_by public.search_data_components_order_by DEFAULT 'score',
    -- Not implemented yet but could have options:
    -- NULL, 'wiki', 'owned'
    -- Note that if 'wiki' is specified, then will return no results if
    -- `filter_by_owner_id` is also specified.
    filter_by_wiki_or_owned public.search_data_components_filter_by_wiki_or_owned DEFAULT NULL,
    -- Will filter to only components owned by this owner_id
    filter_by_owner_id UUID DEFAULT NULL,
    -- Not implemented yet
    filter_by_label_id INT DEFAULT NULL,
    -- Not implemented yet
    -- Will filter to only this component or its dependencies in
    -- `recursive_dependency_ids`
    filter_by_component_id TEXT DEFAULT NULL,
    filter_exclude_test_components BOOLEAN DEFAULT TRUE
)
RETURNS TABLE (
    id INT,
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
    recursive_dependency_ids TEXT[],
    value_type data_component_value_type,
    value_number_display_type data_component_value_number_display_type,
    value_number_sig_figs SMALLINT,
    datetime_range_start TIMESTAMPTZ,
    datetime_range_end TIMESTAMPTZ,
    datetime_repeat_every data_component_datetime_repeat_every,
    units TEXT,
    dimension_ids TEXT[],
    function_arguments JSONB,
    scenarios JSONB,
    plain_title TEXT,
    plain_description TEXT,
    test_run_id TEXT,
    score FLOAT,
    method INT
)
LANGUAGE SQL
-- Use caller's permissions in case in the future we add private data
SECURITY INVOKER
STABLE
SET search_path = 'public'
AS $$

WITH params AS (
    SELECT
        LEAST(GREATEST(limit_n, 1), 101) AS final_limit,  -- clamp to [1, 101]
        LEAST(GREATEST(offset_n, 0), 500) AS final_offset,  -- clamp to [0, 500]
        (
            query LIKE '%"%'
            OR query LIKE '% OR %'
            OR query LIKE '% AND %'
            OR query LIKE '% -%'
        ) as use_websearch,
        (
            query IS NULL OR TRIM(query) = ''
        ) as use_match_all,
        (
            NOT (
                query LIKE '%"%'
                OR query LIKE '% OR %'
                OR query LIKE '% AND %'
                OR query LIKE '% -%'
            )
            AND (query IS NOT NULL AND TRIM(query) <> '')
        ) as use_similarity_search,
        (
            filter_by_owner_id IS NULL
        ) as no_filter_by_owner_id
)

SELECT
    d.id,
    d.owner_id,
    d.version_number,
    d.editor_id,
    d.created_at,
    d.comment,
    d.bytes_changed,
    d.version_type,
    d.version_rolled_back_to,
    d.title,
    d.description,
    d.label_ids,
    d.input_value,
    d.result_value,
    d.recursive_dependency_ids,
    d.value_type,
    d.value_number_display_type,
    d.value_number_sig_figs,
    d.datetime_range_start,
    d.datetime_range_end,
    d.datetime_repeat_every,
    d.units,
    d.dimension_ids,
    d.function_arguments,
    d.scenarios,
    d.plain_title,
    d.plain_description,
    d.test_run_id,
    combined_distinct.score,
    combined_distinct.method
FROM (
    SELECT DISTINCT ON (id)
        id,
        combined.score,
        combined.method
    FROM (

        -- Return all rows if query is empty
        SELECT
            id,
            1.0 AS score, -- or 0, or NULL, as appropriate
            0 AS method
        FROM data_components, params
        WHERE use_match_all
        AND (params.no_filter_by_owner_id OR (owner_id = filter_by_owner_id))
        AND ((filter_exclude_test_components AND id >= 0) OR ((filter_exclude_test_components IS NULL OR filter_exclude_test_components = FALSE) AND id < 0))

        UNION ALL

        -- Full-text search using websearch_to_tsquery (for queries with quotes/operators)
        SELECT
            id,
            ts_rank_cd(search_vector, websearch_to_tsquery('english', query), 32) AS score,
            1 AS method
        FROM data_components, params
        WHERE params.use_websearch
        AND (params.no_filter_by_owner_id OR (owner_id = filter_by_owner_id))
        AND ((filter_exclude_test_components AND id >= 0) OR ((filter_exclude_test_components IS NULL OR filter_exclude_test_components = FALSE) AND id < 0))
        AND search_vector @@ websearch_to_tsquery('english', query)

        UNION ALL

        -- Trigram similarity (for queries without quotes/operators)
        SELECT
            id,
            extension_pg_trgm.similarity(plain_search_text, query) AS score,
            2 AS method
        FROM data_components, params
        WHERE params.use_similarity_search
        AND (params.no_filter_by_owner_id OR (owner_id = filter_by_owner_id))
        AND ((filter_exclude_test_components AND id >= 0) OR ((filter_exclude_test_components IS NULL OR filter_exclude_test_components = FALSE) AND id < 0))
        AND extension_pg_trgm.similarity(plain_search_text, query) > similarity_threshold

        UNION ALL

        -- Full-text search (as backup method)
        SELECT
            id,
            ts_rank_cd(search_vector, websearch_to_tsquery('english', query), 32) AS score,
            1 AS method
        FROM data_components, params
        WHERE params.use_similarity_search
        AND (params.no_filter_by_owner_id OR (owner_id = filter_by_owner_id))
        AND ((filter_exclude_test_components AND id >= 0) OR ((filter_exclude_test_components IS NULL OR filter_exclude_test_components = FALSE) AND id < 0))
        AND search_vector @@ websearch_to_tsquery('english', query)

    ) AS combined
    ORDER BY id

) as combined_distinct
JOIN data_components d ON d.id = combined_distinct.id
ORDER BY combined_distinct.score DESC, combined_distinct.method ASC

LIMIT (SELECT final_limit FROM params)
OFFSET (SELECT final_offset FROM params);

$$;
-- Example usage:
-- SELECT * FROM search_data_components('grav', 0, 10, 0);
-- SELECT * FROM search_data_components('grav', 0, 100, 0, NULL, NULL, '59a8ceba-a13b-4277-aa71-cd6f3a683172');
-- SELECT * FROM search_data_components('', 0, 21, 0, NULL, NULL, NULL, NULL, NULL);
