-- Arcade: הפעלת נחשים וסולמות.

begin;

update public.arcade_games
set enabled = true,
    foundation_only = false
where game_key = 'snakes-and-ladders';

commit;
