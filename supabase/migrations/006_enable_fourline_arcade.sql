-- Phase Arcade-2: enable Fourline only (no other games).

begin;

update public.arcade_games
set enabled = true,
    foundation_only = false
where game_key = 'fourline';

commit;
