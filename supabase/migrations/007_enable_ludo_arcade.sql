-- Phase Arcade: enable Ludo (LIOSH foundation; reward_amount stays 0 in app).

begin;

update public.arcade_games
set enabled = true,
    foundation_only = false
where game_key = 'ludo';

commit;
