-- Putting the reserved_usernames table in the WikiSim private schema for now
-- even though it is also used by the DataCurator app.
CREATE SCHEMA IF NOT EXISTS ws_private;


CREATE TABLE IF NOT EXISTS users (
    id uuid references auth.users NOT NULL PRIMARY KEY,
    name text DEFAULT '' NOT NULL,
    name_lowercase text UNIQUE
    -- Do not add sensitive fields to this table, e.g. fields the user thinks are private because
    -- this is public user information that any other user can access
);



CREATE TABLE ws_private.reserved_usernames (
    name_lowercase TEXT PRIMARY KEY,
    disallow_partial_match BOOLEAN NOT NULL
);

-- Locking down access to only admin via RLS with no policies
alter table ws_private.reserved_usernames enable row level security;


-- Adding some reserved usernames, more added via supabase web console, these
-- are just what github copilot splurged out, seemed reasonable.
INSERT INTO ws_private.reserved_usernames (name_lowercase, disallow_partial_match)
VALUES
    ('administrator', FALSE),
    ('admin', FALSE),
    ('root', FALSE),
    ('support', FALSE),
    ('moderator', FALSE),
    ('system', FALSE),
    ('null', FALSE),
    ('undefined', FALSE),
    ('user', FALSE),
    ('test', FALSE),
    ('datacurator', FALSE),
    ('wikisim', FALSE),
    ('wiki', FALSE),
    ('api', FALSE),
    ('staff', FALSE),
    ('team', FALSE),
    ('contact', FALSE),
    ('help', FALSE),
    ('info', FALSE),
    ('security', FALSE),
    ('billing', FALSE),
    ('sales', FALSE),
    ('marketing', FALSE),
    ('webmaster', FALSE),
    ('abuse', FALSE),
    ('postmaster', FALSE),
    ('hostmaster', FALSE),
    ('noreply', FALSE),
    ('newsletter', FALSE),
    ('office', FALSE),
    ('everyone', FALSE),
    ('everyoneelse', FALSE),
    ('everyone_else', FALSE),
    ('all', FALSE),
    ('allusers', FALSE),
    ('all_users', FALSE),
    ('members', FALSE),
    ('member', FALSE),
    ('guest', FALSE),
    ('guests', FALSE),
    ('anonymous', FALSE),
    ('anon', FALSE),
    ('moderators', FALSE),
    ('editors', FALSE),
    ('editor', FALSE),
    ('contributor', FALSE),
    ('contributors', FALSE),
    ('owner', FALSE),
    ('owners', FALSE),
    ('founder', FALSE),
    ('founders', FALSE),
    ('creator', FALSE),
    ('creators', FALSE),
    ('developer', FALSE),
    ('developers', FALSE),
    ('dev', FALSE),
    ('staffmember', FALSE),
    ('staffmembers', FALSE),
    ('staff_member', FALSE),
    ('team_member', FALSE),
    ('teammember', FALSE),
    ('teammembers', FALSE),
    ('superuser', FALSE),
    ('super_user', FALSE),
    ('superusers', FALSE),
    ('super_users', FALSE),
    ('vip', FALSE),
    ('vips', FALSE),
    ('moderation', FALSE),
    ('moderations', FALSE),
    ('moderator_team', FALSE),
    ('moderatorteam', FALSE),
    ('admin_team', FALSE),
    ('admint eam', FALSE),
    ('administrator_team', FALSE),
    ('administratorteam', FALSE),
    ('rootuser', FALSE),
    ('root_user', FALSE),
    ('systemadmin', FALSE),
    ('system_admin', FALSE),
    ('systemadministrator', FALSE),
    ('system_administrator', FALSE),
    ('helpdesk', FALSE),
    ('help_desk', FALSE),
    ('customerservice', FALSE),
    ('customer_service', FALSE)
    ON CONFLICT DO NOTHING
;
