insert into categories (name) values
('Science'), ('History'), ('Sports'), ('Movies'), ('Technology'), ('Music')
on conflict (name) do nothing;

with cats as (
  select id, name, row_number() over(order by name) as idx from categories
), seq as (
  select generate_series(1, 100) as n
)
insert into questions (
  category_id,
  prompt,
  option_a,
  option_b,
  option_c,
  option_d,
  correct_option,
  difficulty,
  is_active
)
select
  c.id,
  c.name || ' beta question #' || s.n || ': what value equals ' || ((s.n % 4) + 1) || '?',
  '1',
  '2',
  '3',
  '4',
  case ((s.n % 4) + 1) when 1 then 'A' when 2 then 'B' when 3 then 'C' else 'D' end,
  ((s.n - 1) % 3) + 1,
  true
from seq s
join cats c on c.idx = ((s.n - 1) % 6) + 1;
