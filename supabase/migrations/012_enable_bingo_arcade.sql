-- Arcade: הפעלת בינגו.

begin;

update public.arcade_games
set enabled = true,
    foundation_only = false
where game_key = 'bingo';

commit;
