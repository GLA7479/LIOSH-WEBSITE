-- חלון המתנה לפני התחלת משחק (משחקים עם min < max): מתי נקבעו לראשונה min שחקנים פעילים.

begin;

alter table public.arcade_rooms
  add column if not exists start_window_started_at timestamptz;

comment on column public.arcade_rooms.start_window_started_at is
  'ארקייד: מתחילת חלון Auto-start (לאחר שהגיעו min_players מהמשחק ועדיין יש מקום פנוי). מתאפס כשירדו מתחת ל-min או כשהחדר נפתח.';

commit;
