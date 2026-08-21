alter table public.catalog_places
  add column if not exists sheet_key text,
  add column if not exists best_time text[] not null default '{}';

update public.catalog_places set sheet_key='bukhansan', best_time='{matin}' where name like 'Bukhansan%';
update public.catalog_places set sheet_key='bugaksan', best_time='{matin}' where name like 'Bugaksan%';
update public.catalog_places set sheet_key='ansan', best_time='{matin}' where name like 'Ansan%';
update public.catalog_places set sheet_key='namsan', best_time='{matin,fin-aprem,soiree}' where name like 'Namsan%';
update public.catalog_places set sheet_key='dream', best_time='{matin,debut-aprem}' where name like 'Dream Forest%';
update public.catalog_places set sheet_key='huwon', best_time='{matin,debut-aprem}' where name like 'Huwon%';
update public.catalog_places set sheet_key='seoul-forest', best_time='{debut-aprem}' where name like 'Seoul Forest%';
update public.catalog_places set sheet_key='yeouido-hangang', best_time='{debut-aprem,fin-aprem,soiree}' where name like 'Yeouido Hangang%';
update public.catalog_places set sheet_key='seonyudo', best_time='{debut-aprem,fin-aprem}' where name like 'Seonyudo%';
update public.catalog_places set sheet_key='seokchon', best_time='{debut-aprem,fin-aprem,soiree}' where name like 'Seokchon%';
update public.catalog_places set sheet_key='inwangsan', best_time='{fin-aprem}' where name like 'Mont Inwangsan%';
update public.catalog_places set sheet_key='banpo', best_time='{soiree}' where name like 'Banpo%';