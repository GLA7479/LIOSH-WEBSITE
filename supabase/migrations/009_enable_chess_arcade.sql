-- Arcade: הפעלת שחמט (chess).

begin;

update public.arcade_games
set enabled = true,
    foundation_only = false
where game_key = 'chess';

commit;
