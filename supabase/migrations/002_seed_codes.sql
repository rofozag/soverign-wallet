-- Miner activation codes — change before going live
insert into public.activation_codes (code, tier) values
  ('SW-T1-X7K2', 'tier1'),
  ('SW-T2-P3L8', 'tier2'),
  ('SW-T3-Q9R5', 'tier3');

-- Withdrawal codes — add a new row each time you sell one to a user
insert into public.withdrawal_codes (code) values
  ('SW-WD-A1B2C3'),
  ('SW-WD-D4E5F6'),
  ('SW-WD-G7H8I9'),
  ('SW-WD-J1K2L3'),
  ('SW-WD-M4N5O6');
