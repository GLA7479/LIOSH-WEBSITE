-- Arcade: הפעלת דומינו.

begin;

update public.arcade_games
set enabled = true,
    foundation_only = false
where game_key = 'dominoes';

commit;
