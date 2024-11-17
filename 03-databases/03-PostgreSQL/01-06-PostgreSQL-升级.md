
## PostgreSQL 升级

### pg_upgrate 升级

#### 第一次尝试, 跨版本升级


> [!WARNING] 升级失败了
> 老库 pgsql11 当前使用的 timescaledb 版本是 A
> 新库 pgsql12 支持的 timescaledb 的最低版本是 B
> 如果要升级必须先升级老库 pgsql11 中的 timescaledb 版本, 但 老库 pgsql11 是当前的生产环境, 没办法做升级 timescaledb 操作,  所有放弃升级, 维持原样

timescaledb版本不匹配升级失败)

```sh
# 现有 postgresql 11
# 升级到 postgresql 12

安装 postgresql 12
1. yum -y install libicu libxslt postgresql12 postgresql12-contrib postgresql12-libs postgresql12-server

2. 初始化 postgresql 12
sudo -u postgres $pgsql_base/bin/initdb -D ${datadir} -E UTF8 --locale=en_US.utf8 --pwfile=/tmp/pw.file

3. 修改 postgresql 11 和 12 的pg_hba.conf 文件: postgres local 为 trust

4.  创建新版本数据目录
mkdir /data1/pgsql32087
chown postgres:postgres /data1/pgsql32087
su - postgres
/usr/pgsql-12/bin/pg_upgrade --old-bindir /usr/pgsql-11/bin/ --new-bindir /usr/pgsql-12/bin/ --old-datadir /data1/pgsql32087.old/ --new-datadir /data1/pgsql32087/ --link
```