-- Putting this function in the WikiSim private schema for now even though it
-- is also used by the DataCurator app.


CREATE OR REPLACE FUNCTION ws_private.lowercase_and_validate_user_name()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $BODY$
DECLARE
    exists_reserved BOOLEAN;
BEGIN
    new.name = TRIM(new.name);

    -- Check length and allowed characters
    IF LENGTH(new.name) < 4
       OR LENGTH(new.name) > 32
       OR new.name !~ '^[A-Za-z0-9][A-Za-z0-9_]+$' THEN
        RAISE EXCEPTION
            'ERR30. Invalid user name. Must be 4-32 characters long and only contain letters, numbers, and underscores.';
    END IF;

    -- Set lowercase version
    new.name_lowercase = LOWER(new.name);

    -- Check reserved names table
    SELECT EXISTS (
        SELECT 1
        FROM ws_private.reserved_usernames
        WHERE name_lowercase = new.name_lowercase
    ) INTO exists_reserved;

    IF exists_reserved THEN
        RAISE EXCEPTION
            'ERR31. This user name is reserved and cannot be used.';
    END IF;

    -- Check for partial matches in reserved names table
    SELECT EXISTS (
        SELECT 1
        FROM ws_private.reserved_usernames
        WHERE disallow_partial_match = TRUE
          AND POSITION(name_lowercase IN new.name_lowercase) > 0
    ) INTO exists_reserved;

    IF exists_reserved THEN
        RAISE EXCEPTION
            'ERR32. This user name is too similar to a reserved name and cannot be used.';
    END IF;

    RETURN new;
END;
$BODY$;



CREATE TRIGGER users_lowercase_and_validate_user_name_trigger
BEFORE UPDATE OR INSERT
ON public.users
FOR EACH ROW
EXECUTE PROCEDURE ws_private.lowercase_and_validate_user_name();
