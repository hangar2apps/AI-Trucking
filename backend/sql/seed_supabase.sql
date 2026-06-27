-- A-TMS — Supabase schema + demo seed
-- Run this in the Supabase SQL editor. Safe to re-run: it drops and recreates.
--
-- Schema matches backend/app/models.py exactly (native enum types, same
-- columns). The FastAPI app's create_all() is a no-op once these tables exist,
-- so Supabase is the source of truth when you point DATABASE_URL at it.
--
-- Timestamps are now()-relative so the demo stays live: LD-1042 is always
-- ~1h45 late, LD-1043 on track, LD-1044 pending — whenever you run this.

-- ---------------------------------------------------------------------------
-- Reset (reverse dependency order)
-- ---------------------------------------------------------------------------
drop table if exists events cascade;
drop table if exists leads cascade;
drop table if exists loads cascade;
drop table if exists trucks cascade;
drop table if exists customers cascade;
drop type if exists loadstatus;
drop type if exists truckstatus;

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
create type truckstatus as enum ('available', 'en_route', 'maintenance', 'offline');
create type loadstatus  as enum ('pending', 'assigned', 'in_transit', 'delayed', 'delivered', 'cancelled');

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table customers (
    id      serial primary key,
    name    varchar(120) not null,
    company varchar(120) not null,
    email   varchar(255) not null,
    phone   varchar(40)
);

create table trucks (
    id           serial primary key,
    name         varchar(60)  not null,
    driver_name  varchar(120) not null,
    status       truckstatus  not null,
    current_lat  float,
    current_lng  float,
    capacity_lbs integer
);

create table loads (
    id                serial primary key,
    reference         varchar(40) not null unique,
    customer_id       integer not null references customers (id),
    assigned_truck_id integer references trucks (id),
    origin_name       varchar(160) not null,
    origin_lat        float not null,
    origin_lng        float not null,
    dest_name         varchar(160) not null,
    dest_lat          float not null,
    dest_lng          float not null,
    pickup_at         timestamp not null,
    deliver_by        timestamp not null,
    eta               timestamp,
    status            loadstatus not null,
    commodity         varchar(120),
    weight_lbs        integer,
    notes             text
);

-- Action feed for the map + CS dashboard (written by the agent's tools).
create table events (
    id         serial primary key,
    created_at timestamp not null default now(),
    kind       varchar(40) not null,
    load_id    integer references loads (id),
    truck_id   integer references trucks (id),
    summary    text not null,
    data       jsonb
);

-- Marketing survey submissions (matches the Lead model + survey funnel).
create table leads (
    id            serial primary key,
    email         varchar(255) not null,
    phone         varchar(40),
    company_size  varchar(40) not null,
    industry      varchar(80) not null,
    fleet_size    varchar(40) not null,
    features      jsonb not null default '[]'::jsonb,
    pain_point    text not null,
    current_tools varchar(255),
    timeline      varchar(40) not null,
    role          varchar(40) not null,
    consent       boolean not null default true,
    created_at    timestamp not null default now()
);
create index ix_leads_email on leads (email);

-- ---------------------------------------------------------------------------
-- Seed: customers (fresh table → ids 1,2,3)
-- ---------------------------------------------------------------------------
insert into customers (name, company, email, phone) values
    ('Maria Chen',   'Lone Star Components',   'maria.chen@lonestarcomponents.example', '+1-214-555-0182'),
    ('Derek Olsson', 'Gulf Coast Provisions',  'derek@gulfcoastprovisions.example',     '+1-713-555-0144'),
    ('Priya Raman',  'Bayou Medical Supply',   'p.raman@bayoumed.example',              null);

-- Seed: trucks (fresh table → ids 1,2,3,4)
insert into trucks (name, driver_name, status, current_lat, current_lng, capacity_lbs) values
    ('Truck 17', 'Sam Whitfield', 'en_route',    31.55, -96.20, 44000),  -- LD-1042 carrier (stalled mid-lane)
    ('Truck 23', 'Lena Ortiz',    'available',   31.10, -95.95, 44000),  -- the backup for the reroute
    ('Truck 08', 'Marcus Bell',   'en_route',    29.90, -98.10, 42000),  -- mid-lane SA -> Austin
    ('Truck 31', 'Aisha Karim',   'maintenance', 32.78, -96.80, 48000);

-- Seed: loads
-- LD-1042 — the demo load, running ~1h45 late (Truck 17), backup Truck 23 ready.
insert into loads
    (reference, customer_id, assigned_truck_id, origin_name, origin_lat, origin_lng,
     dest_name, dest_lat, dest_lng, pickup_at, deliver_by, eta, status,
     commodity, weight_lbs, notes)
values
    ('LD-1042', 1, 1, 'Dallas, TX', 32.7767, -96.7970, 'Houston, TX', 29.7604, -95.3698,
     now()::timestamp - interval '3 hours',
     now()::timestamp + interval '1 hour 30 minutes',
     now()::timestamp + interval '3 hours 15 minutes',
     'delayed', 'Electronic components', 18500,
     'Truck 17 lost ~2h to an I-45 closure near Corsicana.'),

    ('LD-1043', 2, 3, 'San Antonio, TX', 29.4241, -98.4936, 'Austin, TX', 30.2672, -97.7431,
     now()::timestamp - interval '1 hour',
     now()::timestamp + interval '2 hours',
     now()::timestamp + interval '1 hour 20 minutes',
     'in_transit', 'Packaged foods', 26000, null),

    ('LD-1044', 3, null, 'Houston, TX', 29.7604, -95.3698, 'New Orleans, LA', 29.9511, -90.0715,
     now()::timestamp + interval '4 hours',
     now()::timestamp + interval '12 hours',
     null,
     'pending', 'Medical supplies', 9200, 'Awaiting truck assignment.');

-- Seed: leads (sample survey submissions for the owner/marketing view)
insert into leads
    (email, phone, company_size, industry, fleet_size, features, pain_point,
     current_tools, timeline, role, consent)
values
    ('ops@swifthaul.example', '+1-312-555-0148', '11-50', 'transportation', '26-100',
     '["gps","eld","routing"]'::jsonb,
     'No live ETA visibility; dispatch is all manual phone calls.',
     'Spreadsheets + Samsara', '1-3', 'ops', true),

    ('m.adetona@buildwell.example', null, '51-200', 'construction', '6-25',
     '["gps","maintenance"]'::jsonb,
     'Equipment downtime and missed maintenance windows.',
     null, '6+', 'fleet', true),

    ('dana@coldchainfoods.example', '+1-503-555-0199', '201+', 'food', '100+',
     '["gps","dash-cams","routing","eld"]'::jsonb,
     'Cold-chain compliance and proving on-time delivery to retailers.',
     'Legacy TMS (in-house)', 'now', 'owner', true);
