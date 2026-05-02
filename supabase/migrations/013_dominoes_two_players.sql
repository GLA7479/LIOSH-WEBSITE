-- דומינו: משחק לשני שחקנים בלבד (מתאים למנוע ול־maybeStartDominoesSession)

begin;

update public.arcade_games
set min_players = 2,
    max_players = 2
where game_key = 'dominoes';

commit;
