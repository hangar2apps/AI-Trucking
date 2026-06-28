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
drop table if exists incidents cascade;
drop table if exists events cascade;
drop table if exists leads cascade;
drop table if exists loads cascade;
drop table if exists trucks cascade;
drop table if exists customers cascade;
drop type if exists loadstatus;
drop type if exists truckstatus;
drop type if exists incidentkind;

-- ---------------------------------------------------------------------------
-- Enum types
-- ---------------------------------------------------------------------------
create type truckstatus  as enum ('available', 'en_route', 'maintenance', 'offline');
create type loadstatus   as enum ('pending', 'assigned', 'in_transit', 'delayed', 'delivered', 'cancelled');
create type incidentkind as enum ('weather', 'accident', 'disaster');

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
    id                  serial primary key,
    name                varchar(60)  not null,
    driver_name         varchar(120) not null,
    status              truckstatus  not null,
    current_lat         float,
    current_lng         float,
    capacity_lbs        integer,
    hos_drive_remaining float not null default 11.0,
    hos_duty_remaining  float not null default 14.0,
    hos_since_break     float not null default 0.0
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
    notes             text,
    delay_notified     boolean not null default false,
    delivered_notified boolean not null default false
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

-- Route obstructions the monitor checks (weather / accidents / disasters).
create table incidents (
    id                 serial primary key,
    kind               incidentkind not null,
    summary            varchar(255) not null,
    center_lat         float not null,
    center_lng         float not null,
    radius_mi          float not null,
    severity           varchar(20) not null,  -- watch | warning | severe
    eta_impact_minutes integer not null default 0,
    active             boolean not null default true,
    created_at         timestamp not null default now()
);

-- ---------------------------------------------------------------------------
-- Seed: customers (fresh table → ids 1,2,3)
-- ---------------------------------------------------------------------------
insert into customers (name, company, email, phone) values
    ('Maria Chen',   'Lone Star Components',   'maria.chen@lonestarcomponents.example', '+1-214-555-0182'),
    ('Derek Olsson', 'Gulf Coast Provisions',  'derek@gulfcoastprovisions.example',     '+1-713-555-0144'),
    ('Priya Raman',  'Bayou Medical Supply',   'p.raman@bayoumed.example',              null),
    ('Lin Zhao',     'WestCoast Components',   'lin@westcoastcomponents.example',       '+1-323-555-0110'),
    ('Omar Haddad',  'Great Lakes Freight Co', 'omar@greatlakesfreight.example',        '+1-312-555-0190'),
    ('Rachel Green', 'Sunbelt Foods',          'rachel@sunbeltfoods.example',           '+1-404-555-0173'),
    ('Tom Becker',   'Northeast Retail Group', 'tom@northeastretail.example',           '+1-617-555-0162');

-- Seed: trucks (fresh table → ids 1,2,3,4)
-- HOS: Truck 17 is nearly out of legal hours (can't reach Houston) → forces a
-- reassignment to the well-rested Truck 23.
insert into trucks
    (name, driver_name, status, current_lat, current_lng, capacity_lbs,
     hos_drive_remaining, hos_duty_remaining, hos_since_break) values
    ('Truck 17', 'Sam Whitfield', 'en_route',    31.55, -96.20, 44000, 1.5, 2.0, 7.5),  -- low on hours
    ('Truck 23', 'Lena Ortiz',    'available',   31.40, -96.05, 44000, 11.0, 14.0, 0.0), -- fresh backup, staged beside Truck 17 (north of the storm) for the handoff
    ('Truck 08', 'Marcus Bell',   'en_route',    29.90, -98.10, 42000, 8.0, 11.0, 2.0),
    ('Truck 31', 'Aisha Karim',   'maintenance', 32.78, -96.80, 48000, 11.0, 14.0, 0.0),
    -- National background fleet (all comfortably within hours for their lanes)
    ('Truck 12', 'Diego Morales', 'en_route', 34.0522, -118.2437, 45000, 11.0, 14.0, 0.0),  -- LA → Phoenix
    ('Truck 14', 'Ana Petrov',    'en_route', 47.6062, -122.3321, 43000, 11.0, 14.0, 0.0),  -- Seattle → Portland
    ('Truck 19', 'Kevin Wu',      'en_route', 41.8781,  -87.6298, 46000, 11.0, 14.0, 0.0),  -- Chicago → Detroit
    ('Truck 22', 'Brianna Scott', 'en_route', 33.7490,  -84.3880, 44000, 11.0, 14.0, 0.0),  -- Atlanta → Charlotte
    ('Truck 27', 'Luis Ramos',    'en_route', 39.7392, -104.9903, 47000, 11.0, 14.0, 0.0),  -- Denver → Salt Lake City
    ('Truck 33', 'Hannah Cohen',  'en_route', 40.7128,  -74.0060, 42000, 11.0, 14.0, 0.0);  -- New York → Boston

-- Seed: loads
-- LD-1042 — the demo load, running ~1h45 late (Truck 17), backup Truck 23 ready.
insert into loads
    (reference, customer_id, assigned_truck_id, origin_name, origin_lat, origin_lng,
     dest_name, dest_lat, dest_lng, pickup_at, deliver_by, eta, status,
     commodity, weight_lbs, notes)
values
    ('LD-1042', 1, 1, 'Dallas, TX', 32.7767, -96.7970, 'Houston, TX', 29.7604, -95.3698,
     now()::timestamp - interval '3 hours',
     now()::timestamp + interval '6 hours',
     now()::timestamp + interval '12 hours',
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
     'pending', 'Medical supplies', 9200, 'Awaiting truck assignment.'),

    -- National background fleet — all comfortably on-time (no obstructions on their lanes)
    ('LD-1050', 4, 5, 'Los Angeles, CA', 34.0522, -118.2437, 'Phoenix, AZ', 33.4484, -112.0740,
     now()::timestamp - interval '2 hours', now()::timestamp + interval '11 hours',
     now()::timestamp + interval '7 hours', 'in_transit', 'Auto parts', 31000, null),

    ('LD-1051', 4, 6, 'Seattle, WA', 47.6062, -122.3321, 'Portland, OR', 45.5152, -122.6784,
     now()::timestamp - interval '1 hour', now()::timestamp + interval '7 hours',
     now()::timestamp + interval '3 hours', 'in_transit', 'Lumber', 39000, null),

    ('LD-1052', 5, 7, 'Chicago, IL', 41.8781, -87.6298, 'Detroit, MI', 42.3314, -83.0458,
     now()::timestamp - interval '2 hours', now()::timestamp + interval '9 hours',
     now()::timestamp + interval '5 hours', 'in_transit', 'Steel coils', 44000, null),

    ('LD-1053', 6, 8, 'Atlanta, GA', 33.7490, -84.3880, 'Charlotte, NC', 35.2271, -80.8431,
     now()::timestamp - interval '1 hour', now()::timestamp + interval '8 hours',
     now()::timestamp + interval '4 hours', 'in_transit', 'Produce', 28000, null),

    ('LD-1054', 4, 9, 'Denver, CO', 39.7392, -104.9903, 'Salt Lake City, UT', 40.7608, -111.8910,
     now()::timestamp - interval '3 hours', now()::timestamp + interval '14 hours',
     now()::timestamp + interval '10 hours', 'in_transit', 'Industrial equipment', 41000, null),

    ('LD-1055', 7, 10, 'New York, NY', 40.7128, -74.0060, 'Boston, MA', 42.3601, -71.0589,
     now()::timestamp - interval '1 hour', now()::timestamp + interval '7 hours',
     now()::timestamp + interval '4 hours', 'in_transit', 'Retail goods', 22000, null),

    -- Backlog awaiting assignment
    ('LD-1056', 5, null, 'Kansas City, MO', 39.0997, -94.5786, 'St. Louis, MO', 38.6270, -90.1994,
     now()::timestamp + interval '3 hours', now()::timestamp + interval '12 hours',
     null, 'pending', 'Beverages', 30000, 'Awaiting truck assignment.'),

    ('LD-1057', 6, null, 'Phoenix, AZ', 33.4484, -112.0740, 'Las Vegas, NV', 36.1699, -115.1398,
     now()::timestamp + interval '5 hours', now()::timestamp + interval '15 hours',
     null, 'pending', 'Appliances', 26000, 'Awaiting truck assignment.'),

    ('LD-1058', 7, null, 'Nashville, TN', 36.1627, -86.7816, 'Memphis, TN', 35.1495, -90.0490,
     now()::timestamp + interval '2 hours', now()::timestamp + interval '11 hours',
     null, 'pending', 'Textiles', 19000, 'Awaiting truck assignment.'),

    ('LD-1059', 4, null, 'Miami, FL', 25.7617, -80.1918, 'Orlando, FL', 28.5383, -81.3792,
     now()::timestamp + interval '6 hours', now()::timestamp + interval '20 hours',
     null, 'pending', 'Paper products', 24000, 'Awaiting truck assignment.');

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

-- Seed: incidents — a severe storm ahead of Truck 17 on the I-45 lane to Houston.
insert into incidents
    (kind, summary, center_lat, center_lng, radius_mi, severity, eta_impact_minutes, active)
values
    ('weather',  'Severe storm band on I-45 near Huntsville',        30.72,  -95.55, 35.0, 'severe',  75, true),
    ('disaster', 'Wildfire near Redding, CA',                        40.5865, -122.3917, 45.0, 'severe', 120, true),
    ('weather',  'Blizzard warning across central Minnesota',        45.50,  -94.50, 70.0, 'severe',  90, true),
    ('weather',  'Hurricane approaching SE Florida coast',           26.20,  -79.50, 80.0, 'severe', 150, true),
    ('accident', 'Multi-vehicle pileup on I-80, Pennsylvania',       41.05,  -77.55, 28.0, 'warning', 45, true);
