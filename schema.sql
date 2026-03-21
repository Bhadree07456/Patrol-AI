CREATE DATABASE IF NOT EXISTS `Patrol AI`;
USE `Patrol AI`;

CREATE TABLE IF NOT EXISTS risk_zones (
  id    INT PRIMARY KEY,
  city  VARCHAR(100),
  name  VARCHAR(200),
  type  VARCHAR(100),
  lat   DOUBLE,
  lng   DOUBLE,
  risk  INT,
  date  VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS hq_locations (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(200),
  lat   DOUBLE,
  lng   DOUBLE
);
