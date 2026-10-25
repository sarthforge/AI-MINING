-- Paste into the Supabase SQL editor (Dashboard → SQL).
-- Creates PostGIS + MVP tables with RLS. Safe to re-run only on an empty project
-- (drop tables first if you need a clean reset).

create extension if not exists postgis;

-- 1. profile (linked to Supabase Auth) — created BEFORE anything that references it
create table public.profile (
  id         uuid primary key references auth.users(id) on delete cascade,
  email      text unique not null,
  full_name  text,
  role       text not null default 'viewer' check (role in ('admin','viewer')),
  created_at timestamptz not null default now()
);

-- 2. mining_site  (MiningSite)
create table public.mining_site (
  id                    text primary key,
  code                  text unique not null,
  name                  text not null,
  region                text not null,
  country               text not null,
  latitude              double precision not null,
  longitude             double precision not null,
  location              geography(Point,4326)
                        generated always as (st_setsrid(st_makepoint(longitude, latitude),4326)::geography) stored,
  formatted_coordinates text not null,
  total_area_ha         numeric(10,2) not null,
  new_excavation_ha     numeric(10,2) not null,
  change_percentage     numeric(6,2)  not null,
  confidence_score      numeric(5,2)  not null,
  concession_status     text not null check (concession_status in
                          ('Licensed','Unlicensed','Permit Expired','Boundary Breach')),
  alert_status          text not null check (alert_status in
                          ('High Priority','Investigation Required','Normal Compliance','Under Review')),
  mineral_target        text not null,
  last_observation_date date not null,
  baseline_date         date not null,
  ndvi_baseline         numeric(4,3) not null,
  ndvi_current          numeric(4,3) not null,
  sensor                text not null,
  resolution            text not null,
  notes                 text not null default '',
  current_image_url     text not null,
  baseline_image_url    text not null,
  updated_at            timestamptz not null default now()
);
create index idx_site_location on public.mining_site using gist(location);

-- 3. overlay_polygon  (OverlayPolygon)
create table public.overlay_polygon (
  id           text primary key,
  site_id      text not null references public.mining_site(id) on delete cascade,
  title        text not null,
  poly_type    text not null check (poly_type in ('suspected','concession','pit','water','road')),
  area_ha      numeric(10,2) not null,
  color        text not null,
  stroke_color text not null,
  label        text not null,
  points       text not null,
  geom         geometry(Polygon,4326),
  description  text not null default ''
);
create index idx_poly_site on public.overlay_polygon(site_id);
create index idx_poly_geom on public.overlay_polygon using gist(geom);

-- 4. satellite_alert  (SatelliteAlert)
create table public.satellite_alert (
  id                text primary key,
  site_id           text not null references public.mining_site(id) on delete cascade,
  title             text not null,
  description       text not null,
  severity          text not null check (severity in ('critical','warning','info','compliant')),
  detected_hectares numeric(10,2) not null,
  confidence        numeric(5,2) not null,
  detected_at       timestamptz not null,
  coordinates       text not null,
  category          text not null check (category in ('Boundary Breach',
                      'Riparian Buffer Encroachment','Unregistered Pit Expansion','Tailings Plume')),
  dismissed         boolean not null default false,
  dismissed_by      uuid references public.profile(id),
  dismissed_at      timestamptz
);
create index idx_alert_site   on public.satellite_alert(site_id);
create index idx_alert_active on public.satellite_alert(dismissed, severity, detected_at desc);

-- 5. monthly_change_point  (MonthlyChangePoint)
create table public.monthly_change_point (
  id                    bigint generated always as identity primary key,
  site_id               text not null references public.mining_site(id) on delete cascade,
  month_label           text not null,
  obs_date              date not null,
  permitted_cap_ha      numeric(10,2) not null,
  total_excavation_ha   numeric(10,2) not null,
  unauthorized_ha       numeric(10,2) not null,
  vegetation_index_ndvi numeric(4,3) not null,
  turbidity_index       numeric(6,2) not null,
  unique (site_id, obs_date)
);

-- 6. analysis_job
create table public.analysis_job (
  id                 uuid primary key default gen_random_uuid(),
  site_id            text not null references public.mining_site(id) on delete cascade,
  job_status         text not null default 'QUEUED' check (job_status in ('QUEUED','RUNNING','DONE','FAILED')),
  baseline_date      date not null,
  current_image_date date not null,
  progress           int not null default 0,
  result_json        jsonb,
  error_message      text,
  created_by         uuid references public.profile(id),
  created_at         timestamptz not null default now(),
  finished_at        timestamptz
);

-- 7. telemetry_status (single row)
create table public.telemetry_status (
  id smallint primary key default 1 check (id = 1),
  constellation text, orbit_mode text, last_pass_utc text, next_pass_eta text,
  cloud_coverage text, sun_azimuth text, sensor_bands text,
  ground_sampling_distance text, cadastre_sync text
);

-- RLS: API uses the server DB URL; block direct browser access
alter table public.profile              enable row level security;
alter table public.mining_site          enable row level security;
alter table public.overlay_polygon      enable row level security;
alter table public.satellite_alert      enable row level security;
alter table public.monthly_change_point enable row level security;
alter table public.analysis_job         enable row level security;
alter table public.telemetry_status     enable row level security;
create policy "own profile" on public.profile for select using (auth.uid() = id);
