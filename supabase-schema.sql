-- Components: static definition of each panel element
create table components (
  id text primary key,
  panel_id text not null default 'quadro-01',
  type text not null, -- 'main-switch' | 'breakers' | 'gauge' | 'aux-panel' | 'blank'
  label text,
  config jsonb not null default '{}',
  col_index int not null default 0,
  row_index int not null default 0
);

-- Readings: every value captured by the camera AI (full history)
create table readings (
  id bigint generated always as identity primary key,
  component_id text not null references components(id) on delete cascade,
  value jsonb not null, -- e.g. {"status":"on"} or {"items":[1,0,1,1]} or {"value":340}
  captured_at timestamptz not null default now()
);

create index readings_component_id_captured_at on readings(component_id, captured_at desc);

-- Alert configs: one rule per component
create table alert_configs (
  id bigint generated always as identity primary key,
  component_id text not null references components(id) on delete cascade,
  type text not null, -- 'on-change' | 'threshold'
  condition text, -- 'above' | 'below' (only for threshold type)
  threshold numeric,
  enabled boolean not null default true,
  unique(component_id)
);

-- Recipients: email addresses for notifications
create table recipients (
  id bigint generated always as identity primary key,
  email text not null unique
);

-- Alert history: log of every alert that fired
create table alert_history (
  id bigint generated always as identity primary key,
  component_id text not null references components(id) on delete cascade,
  value jsonb not null,
  condition text,
  threshold numeric,
  notified_emails text[],
  triggered_at timestamptz not null default now()
);

-- Enable Realtime on readings so the dashboard updates live
alter publication supabase_realtime add table readings;

-- Seed components (matching the current mock data)
insert into components (id, type, label, config, col_index, row_index) values
  ('main-switch', 'main-switch', 'Generale Q1', '{}', 0, 0),
  ('r1',  'breakers', 'Linea A', '{"count":6}', 0, 1),
  ('r2',  'breakers', 'Linea B', '{"count":6}', 0, 2),
  ('r3',  'breakers', 'Linea C', '{"count":6}', 0, 3),
  ('r4',  'breakers', 'Linea D', '{"count":6}', 0, 4),
  ('r5',  'breakers', 'Linea E', '{"count":6}', 0, 5),
  ('r6',  'breakers', 'Linea F', '{"count":6}', 1, 0),
  ('r7',  'breakers', 'Linea G', '{"count":6}', 1, 1),
  ('r8',  'breakers', 'Linea H', '{"count":6}', 1, 2),
  ('r9',  'breakers', 'Linea I', '{"count":6}', 1, 3),
  ('r10', 'breakers', 'Linea L', '{"count":6}', 1, 4),
  ('r11', 'breakers', 'Linea M', '{"count":6}', 1, 5),
  ('r12', 'breakers', 'Linea N', '{"count":6}', 2, 0),
  ('r13', 'breakers', 'Linea O', '{"count":6}', 2, 1),
  ('r14', 'breakers', 'Linea P', '{"count":6}', 2, 2),
  ('r15', 'breakers', 'Linea Q', '{"count":6}', 2, 3),
  ('gauge-1', 'gauge', 'Amperometro', '{"unit":"A","min":0,"max":500}', 2, 4),
  ('gauge-2', 'gauge', 'Voltmetro',   '{"unit":"V","min":0,"max":480}', 2, 5),
  ('r18', 'breakers', 'Linea T', '{"count":6}', 3, 0),
  ('r19', 'breakers', 'Linea U', '{"count":6}', 3, 1),
  ('aux-panel', 'aux-panel', 'Circuito ausiliari', '{"text":"CIRCUITO AUSILIARI\nAPPARECCHIATURE\nIMPIANTO DI REGOLAZIONE\nE GESTIONE MANUALE"}', 3, 2);

-- Seed initial readings
insert into readings (component_id, value) values
  ('main-switch', '{"status":"on"}'),
  ('r1',  '{"items":[1,1,0,1,1,0]}'),
  ('r2',  '{"items":[1,0,1,1,0,1]}'),
  ('r3',  '{"items":[1,1,1,0,1,0]}'),
  ('r4',  '{"items":[0,1,1,1,0,1]}'),
  ('r5',  '{"items":[1,1,0,1,1,1]}'),
  ('r6',  '{"items":[1,1,0,0,1,1]}'),
  ('r7',  '{"items":[1,0,1,0,1,1]}'),
  ('r8',  '{"items":[1,1,1,1,0,0]}'),
  ('r9',  '{"items":[1,0,1,1,1,0]}'),
  ('r10', '{"items":[0,1,0,1,1,1]}'),
  ('r11', '{"items":[1,1,0,1,0,1]}'),
  ('r12', '{"items":[1,1,0,1,1,1]}'),
  ('r13', '{"items":[1,0,1,1,0,1]}'),
  ('r14', '{"items":[1,1,1,0,1,1]}'),
  ('r15', '{"items":[0,1,1,1,1,0]}'),
  ('gauge-1', '{"value":340}'),
  ('gauge-2', '{"value":398}'),
  ('r18', '{"items":[1,1,1,1,0,0]}'),
  ('r19', '{"items":[1,1,0,1,1,0]}'),
  ('aux-panel', '{}');
