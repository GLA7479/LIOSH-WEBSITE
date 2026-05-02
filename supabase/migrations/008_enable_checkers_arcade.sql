-- Arcade: הפעלת דמקה (checkers) אחרי חיבור קוד.

begin;

update public.arcade_games
set enabled = true,
    foundation_only = false
where game_key = 'checkers';

commit;
