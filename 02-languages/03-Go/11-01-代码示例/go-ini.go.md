## mysql初始化

```
dbinit.sh 调用 dbagent mysql init -p port -r master -v version -h ip
dbagent  调用api 或 rpc 发送给dbnaapi( mysql init -p port -r master -v version -h ip)
dbaapi 根据参数初始化生成配置文件, 保存到mongodb
dbaapi 获取mongodb里的配置信息
dbaapi 根据参数调整从mongodb获取到的配置参数(server_id, report_host, 只读参数等)
dbaapi 并调用rpc dbagent 创建配置文件 
dbagent 收到dbaapi传过来的配置文件，覆盖配置文件 
```

## mysql扩容

```
dbinit.sh 调用 dbagent mysql init -p port -r slave -v version -h ip
dbagent  调用api 或 rpc 发送给dbnaapi( mysql init -p port -r slave -v version -h ip)
dbaapi 获取mongodb里的配置信息
dbaapi 根据参数调整从mongodb获取到的配置参数(server_id, report_host, 只读参数等)
dbaapi 并调用rpc dbagent 创建配置文件 
dbagent 收到dbaapi传过来的配置文件，覆盖配置文件 
```

```go
/*
@Author : lsne
@Date : 2020-09-12 21:17
*/

package main

import (
	"fmt"
	"strconv"
	"strings"

	"gopkg.in/ini.v1"
)

type MysqlConf struct {
	User                           string `json:"user" ini:"user"`
	Port                           uint16 `json:"port" ini:"port"`
	DefaultStorageEngine           string `json:"default_storage_engine" ini:"default_storage_engine"`
	Socket                         string `json:"socket" ini:"socket"`
	PidFile                        string `json:"pid_file" ini:"pid_file"`
	SecureFilePriv                 string `json:"secure_file_priv" ini:"secure_file_priv"`
	LocalInfile                    string `json:"local_infile" ini:"local_infile"`
	KeyBufferSize                  uint64 `json:"key_buffer_size" ini:"key_buffer_size"`
	MaxAllowedPacket               uint32 `json:"max_allowed_packet" ini:"max_allowed_packet"`
	MaxConnectErrors               uint32 `json:"max_connect_errors" ini:"max_connect_errors"`
	Datadir                        string `json:"datadir" ini:"datadir"`
	Tmpdir                         string `json:"tmpdir" ini:"tmpdir"`
	LogBin                         string `json:"log_bin" ini:"log_bin"`
	BinlogExpireLogsSeconds        uint32 `json:"binlog_expire_logs_seconds" ini:"binlog_expire_logs_seconds"`
	RelayLog                       string `json:"relay_log" ini:"relay_log"`
	SlaveTransactionRetries        uint64 `json:"slave_transaction_retries" ini:"slave_transaction_retries"`
	TmpTableSize                   uint64 `json:"tmp_table_size" ini:"tmp_table_size"`
	MaxHeapTableSize               uint64 `json:"max_heap_table_size" ini:"max_heap_table_size"`
	MaxConnections                 uint32 `json:"max_connections" ini:"max_connections"`
	ThreadCacheSize                int32  `json:"thread_cache_size" ini:"thread_cache_size"`
	OpenFilesLimit                 uint64 `json:"open_files_limit" ini:"open_files_limit"`
	WaitTimeout                    uint32 `json:"wait_timeout" ini:"wait_timeout"`
	InteractiveTimeout             uint32 `json:"interactive_timeout" ini:"interactive_timeout"`
	BinlogFormat                   string `json:"binlog_format" ini:"binlog_format"`
	CharacterSetServer             string `json:"character_set_server" ini:"character_set_server"`
	SkipNameResolve                string `json:"skip_name_resolve" ini:"skip_name_resolve"`
	BackLog                        int32  `json:"back_log" ini:"back_log"`
	InnodbFlushMethod              string `json:"innodb_flush_method" ini:"innodb_flush_method"`
	InnodbDataHomeDir              string `json:"innodb_data_home_dir" ini:"innodb_data_home_dir"`
	InnodbDataFilePath             string `json:"innodb_data_file_path" ini:"innodb_data_file_path"`
	InnodbLogGroupHomeDir          string `json:"innodb_log_group_home_dir" ini:"innodb_log_group_home_dir"`
	InnodbLogFilesInGroup          uint8  `json:"innodb_log_files_in_group" ini:"innodb_log_files_in_group"`
	InnodbLogFileSize              uint64 `json:"innodb_log_file_size" ini:"innodb_log_file_size"`
	InnodbFlushLogAtTrxCommit      uint8  `json:"innodb_flush_log_at_trx_commit" ini:"innodb_flush_log_at_trx_commit"`
	InnodbFilePerTable             string `json:"innodb_file_per_table" ini:"innodb_file_per_table"`
	InnodbBufferPoolInstances      uint8  `json:"innodb_buffer_pool_instances" ini:"innodb_buffer_pool_instances"`
	InnodbFlushSync                string `json:"innodb_flush_sync" ini:"innodb_flush_sync"`
	InnodbIoCapacity               uint64 `json:"innodb_io_capacity" ini:"innodb_io_capacity"`
	InnodbIoCapacityMax            uint64 `json:"innodb_io_capacity_max	" ini:"innodb_io_capacity_max	"`
	InnodbLockWaitTimeout          uint32 `json:"innodb_lock_wait_timeout" ini:"innodb_lock_wait_timeout"`
	InnodbMaxDirtyPagesPct         string `json:"innodb_max_dirty_pages_pct" ini:"innodb_max_dirty_pages_pct"` //应该是个带小数的数值型
	InnodbDefaultRowFormat         string `json:"innodb_default_row_format" ini:"innodb_default_row_format"`
	InnodbBufferPoolDumpAtShutdown string `json:"innodb_buffer_pool_dump_at_shutdown" ini:"innodb_buffer_pool_dump_at_shutdown"`
	InnodbBufferPoolLoadAtStartup  string `json:"innodb_buffer_pool_load_at_startup" ini:"innodb_buffer_pool_load_at_startup"`
	InnodbBufferPoolDumpPct        uint8  `json:"innodb_buffer_pool_dump_pct" ini:"innodb_buffer_pool_dump_pct"`
	InnodbPrintAllDeadlocks        string `json:"innodb_print_all_deadlocks" ini:"innodb_print_all_deadlocks"`
	LogError                       string `json:"log_error" ini:"log_error"`
	SlowQueryLog                   string `json:"slow_query_log" ini:"slow_query_log"`
	SlowQueryLogFile               string `json:"slow_query_log_file" ini:"slow_query_log_file"`
	LongQueryTime                  string `json:"long_query_time" ini:"long_query_time"` //应该是个带小数的数值型
	GtidMode                       string `json:"gtid_mode" ini:"gtid_mode"`
	EnforceGtidConsistency         string `json:"enforce_gtid_consistency" ini:"enforce_gtid_consistency"`
	LogSlaveUpdates                string `json:"log_slave_updates" ini:"log_slave_updates"`
	MasterInfoRepository           string `json:"master_info_repository" ini:"master_info_repository"`
	RelayLogInfoRepository         string `json:"relay_log_info_repository" ini:"relay_log_info_repository"`
	RelayLogRecovery               string `json:"relay_log_recovery" ini:"relay_log_recovery"`
	PerformanceSchema              string `json:"performance_schema" ini:"performance_schema"`
	TablespaceDefinitionCache      uint32 `json:"tablespace_definition_cache" ini:"tablespace_definition_cache"`
	Mysqlx                         string `json:"mysqlx" ini:"mysqlx"`
	MysqlxCacheCleaner             string `json:"mysqlx_cache_cleaner" ini:"mysqlx_cache_cleaner"`
	InnodbNumaInterleave           string `json:"innodb_numa_interleave" ini:"innodb_numa_interleave"`
	DefaultAuthenticationPlugin    string `json:"default_authentication_plugin" ini:"default_authentication_plugin"`
	SqlMode                        string `json:"sql_mode" ini:"sql_mode"`
	LogTimestamps                  string `json:"log_timestamps" ini:"log_timestamps"`
	LowerCaseTableNames            uint8  `json:"lower_case_table_names" ini:"lower_case_table_names"`
	ServerId                       uint32 `json:"server_id" ini:"server_id"`
	InnodbBufferPoolSize           uint64 `json:"innodb_buffer_pool_size" ini:"innodb_buffer_pool_size"`
	SkipSlaveStart                 string `json:"skip_slave_start" ini:"skip_slave_start"`
	ReportHost                     string `json:"report_host" ini:"report_host"`
	ReportPort                     uint16 `json:"report_port" ini:"report_port"`
	ReadOnly                       string `json:"read_only" ini:"read_only"`
	SuperReadOnly                  string `json:"super_read_only" ini:"super_read_only"`
}

func NewMysqlConf(port uint16, ip string, version string, role string) (*MysqlConf, error) {
	sport := strconv.FormatUint(uint64(port), 10)
	baseDir := "/data1"
	insDir := baseDir + "/mysql" + sport
	homeDir := insDir + "/"
	ips := strings.SplitN(ip, ".", 2)
	serverIDs := strings.Replace(ips[1], ".", "", -1)
	serverID64, err := strconv.ParseUint(serverIDs, 10, 32)
	serverID := uint32(serverID64)
	if err != nil {
		return nil, err
	}

	var readOnly = "OFF"
	if role == "slave" {
		readOnly = "ON"
	}

	return &MysqlConf{
		User:                           "my" + sport,
		Port:                           port,
		DefaultStorageEngine:           "InnoDB",
		Socket:                         "/tmp/mysql" + sport + ".sock",
		PidFile:                        homeDir + "mysql.pid",
		SecureFilePriv:                 homeDir + "mysql-outfile-dir/",
		LocalInfile:                    "ON",
		KeyBufferSize:                  134217728,
		MaxAllowedPacket:               16777216,
		MaxConnectErrors:               1000000,
		Datadir:                        homeDir,
		Tmpdir:                         homeDir,
		LogBin:                         homeDir + sport + "/" + sport + "-binlog",
		BinlogExpireLogsSeconds:        432000,
		RelayLog:                       homeDir + sport + "/" + sport + "-relaylog",
		SlaveTransactionRetries:        100,
		TmpTableSize:                   33554432,
		MaxHeapTableSize:               33554432,
		MaxConnections:                 5000,
		ThreadCacheSize:                512,
		OpenFilesLimit:                 65535,
		WaitTimeout:                    600,
		InteractiveTimeout:             600,
		BinlogFormat:                   "ROW",
		CharacterSetServer:             "UTF8MB4",
		SkipNameResolve:                "ON",
		BackLog:                        1024,
		InnodbFlushMethod:              "O_DIRECT",
		InnodbDataHomeDir:              homeDir,
		InnodbDataFilePath:             "ibdata1:100M:autoextend",
		InnodbLogGroupHomeDir:          homeDir,
		InnodbLogFilesInGroup:          3,
		InnodbLogFileSize:              536870912,
		InnodbFlushLogAtTrxCommit:      0,
		InnodbFilePerTable:             "ON",
		InnodbBufferPoolInstances:      1,
		InnodbFlushSync:                "OFF",
		InnodbIoCapacity:               1000,
		InnodbIoCapacityMax:            10000,
		InnodbLockWaitTimeout:          20,
		InnodbMaxDirtyPagesPct:         "90",
		InnodbDefaultRowFormat:         "DYNAMIC",
		InnodbBufferPoolDumpAtShutdown: "ON",
		InnodbBufferPoolLoadAtStartup:  "ON",
		InnodbBufferPoolDumpPct:        50,
		InnodbPrintAllDeadlocks:        "OFF",
		LogError:                       homeDir + "error.log",
		SlowQueryLog:                   "ON",
		SlowQueryLogFile:               homeDir + "mysql-slow.log",
		LongQueryTime:                  "0.5",
		GtidMode:                       "ON",
		EnforceGtidConsistency:         "ON",
		LogSlaveUpdates:                "ON",
		MasterInfoRepository:           "TABLE",
		RelayLogInfoRepository:         "TABLE",
		RelayLogRecovery:               "ON",
		PerformanceSchema:              "ON",
		TablespaceDefinitionCache:      10240,
		Mysqlx:                         "OFF",
		MysqlxCacheCleaner:             "0",
		InnodbNumaInterleave:           "ON",
		DefaultAuthenticationPlugin:    "mysql_native_password",
		SqlMode:                        "'STRICT_TRANS_TABLES,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION'",
		LogTimestamps:                  "SYSTEM",
		LowerCaseTableNames:            1,
		ServerId:                       serverID,
		InnodbBufferPoolSize:           1073741824,
		SkipSlaveStart:                 "ON",
		ReportHost:                     ip,
		ReportPort:                     port,
		ReadOnly:                       readOnly,
		SuperReadOnly:                  readOnly,
	}, nil
}

func main() {
	conf, err := NewMysqlConf(54320, "10.95.58.81", "mysql80", "slave")
	if err != nil {
		fmt.Println(err)
	}

	cfg := ini.Empty()
	err = cfg.Section("mysqld").ReflectFrom(conf)
	cfg.SaveTo("d:/01_workspaces/golang/test/testconfig/ini/my1.ini")

}

```