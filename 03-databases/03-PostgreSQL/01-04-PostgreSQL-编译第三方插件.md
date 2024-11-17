
## 编译第三方插件

```sql
select name from pg_available_extensions;  # 查看可用插件
```

#### 一. 编译 timescaledb 

参考: [timescaledb docs](https://docs.timescale.com/getting-started/latest/)

```sh
# 1. 下载源码仓库
git clone https://github.com/timescale/timescaledb.git
cd timescaledb
git checkout 2.6.0
export PATH=/opt/pgsql5447/server/bin:$PATH
./bootstrap -DUSE_OPENSSL=0   #如果pgsql没有开始openssl, 则在编译 timescaledb 时, 需要加参数也取消 timescaledb 的 openssl 支持
cd ./build/
make 
make install


# 编译完成后, 在 postgres.conf 添加参数并重新启动, 使实例加载 插件

# 1. vim /opt/pgsql5447/data/postgresql.conf
shared_preload_libraries         = 'pg_stat_statements,timescaledb'

systemctl restart postgres5447
```

```sql
-- 使用 timescaledb 插件

-- 1. 对库启用插件
 psql 
\c newdb
CREATE EXTENSION IF NOT EXISTS timescaledb;

2. 创建表
CREATE TABLE conditions (
  time        TIMESTAMPTZ       NOT NULL,
  location    TEXT              NOT NULL,
  temperature DOUBLE PRECISION  NULL,
  humidity    DOUBLE PRECISION  NULL
);

-- 转换为按时间分区的超表
SELECT create_hypertable('conditions', 'time');

3. 插入 与 查询
INSERT INTO conditions(time, location, temperature, humidity)
  VALUES (NOW(), 'office', 70.0, 50.0);

SELECT * FROM conditions ORDER BY time DESC LIMIT 100;

SELECT time_bucket('15 minutes', time) AS fifteen_min,
    location, COUNT(*),
    MAX(temperature) AS max_temp,
    MAX(humidity) AS max_hum
  FROM conditions
  WHERE time > NOW() - interval '3 hours'
  GROUP BY fifteen_min, location
  ORDER BY fifteen_min DESC, max_temp DESC;
```

#### 二. 编译 hll

参考: [postgresql-hll](https://github.com/citusdata/postgresql-hll)

```sh
# 1. 
git clone https://github.com/citusdata/postgresql-hll.git
cd postgresql-hll/
git checkout v2.16
git branch
PG_CONFIG=/opt/pgsql5447/server/bin/pg_config make
PG_CONFIG=/opt/pgsql5447/server/bin/pg_config make install




# 编译完成后, 不用改 postgresql.conf 配置文件, 实例不用重启就能使用
```

```sql
-- 使用 hll 插件

-- 1. 对newdb库启用插件
  psql 
\c newdb
CREATE EXTENSION IF NOT EXISTS hll;

-- 2. 创建表
--- Make a dummy table
CREATE TABLE helloworld (
	id              integer,
	set     hll
);

--- Insert an empty HLL
INSERT INTO helloworld(id, set) VALUES (1, hll_empty());

--- Add a hashed integer to the HLL
UPDATE helloworld SET set = hll_add(set, hll_hash_integer(12345)) WHERE id = 1;

--- Or add a hashed string to the HLL
UPDATE helloworld SET set = hll_add(set, hll_hash_text('hello world')) WHERE id = 1;

--- Get the cardinality of the HLL
SELECT hll_cardinality(set) FROM helloworld WHERE id = 1;
```
