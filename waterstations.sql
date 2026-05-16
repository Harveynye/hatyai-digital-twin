DROP TABLE IF EXISTS flood.flood;

CREATE TABLE flood.flood (
    time TIMESTAMP,
    water_level_msl DOUBLE PRECISION,
    station_name_en TEXT,
    station_code TEXT,
    lat DOUBLE PRECISION,
    lon DOUBLE PRECISION,
    district TEXT,
    subdistrict TEXT,
    province TEXT
);

ALTER TABLE flood.flood
ADD COLUMN geom geometry(Point, 4326);

UPDATE flood.flood
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
CREATE EXTENSION postgis;
SELECT PostGIS_Version();
ALTER TABLE flood.flood
ADD COLUMN geom geometry(Point, 4326);

UPDATE flood.flood
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);

SELECT COUNT(*) 
FROM flood.flood;
COPY flood.flood
FROM 'C:/Digital_Twin/hatyai_target_stations_ascii.csv'
DELIMITER ','
CSV HEADER;

COPY flood.flood
(time, water_level_msl, station_name_en, station_code, lat, lon, district, subdistrict, province)
FROM 'C:/Digital_Twin/hatyai_target_stations_ascii.csv'
DELIMITER ','
CSV HEADER;

SELECT COUNT(*) FROM flood.flood;
UPDATE flood.flood
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
TRUNCATE TABLE flood.flood;
UPDATE flood.flood
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
SELECT station_code, water_level_msl, ST_AsText(geom)
FROM flood.flood;
COPY flood.flood
(time, water_level_msl, station_name_en, station_code, lat, lon, district, subdistrict, province)
FROM 'C:/Digital_Twin/hatyai_target_stations_ascii.csv'
DELIMITER ','
CSV HEADER;
SELECT COUNT(*) FROM flood.flood;
UPDATE flood.flood
SET geom = ST_SetSRID(ST_MakePoint(lon, lat), 4326);
SELECT station_code, water_level_msl, ST_AsText(geom)
FROM flood.flood;