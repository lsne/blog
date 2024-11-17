```go
dao/utils.go

package dao

import "database/sql"

func ScanMap(rows *sql.Rows) (map[string]sql.NullString, error) {

	columns, err := rows.Columns()

	if err != nil {
		return nil, err
	}

	if !rows.Next() {
		err = rows.Err()
		if err != nil {
			return nil, err
		} else {
			return nil, nil
		}
	}

	values := make([]interface{}, len(columns))

	for index := range values {
		values[index] = new(sql.NullString)
	}

	err = rows.Scan(values...)

	if err != nil {
		return nil, err
	}

	result := make(map[string]sql.NullString)

	for index, columnName := range columns {
		result[columnName] = *values[index].(*sql.NullString)
	}

	return result, nil
}

```

```go
dao/conn.go

package dao

import (
	"database/sql"
	"fmt"

	_ "github.com/go-sql-driver/mysql"
)

type MariaDBConn struct {
	Host     string
	Port     int
	User     string
	Password string
	DBName   string
	Charset  string
	URI      string
	DB       *sql.DB
}

func NewMariaDBConn(host string, port int, user, password, dbname string) (*MariaDBConn, error) {
	url := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=True&loc=Local", user, password, host, port, dbname, "utf8mb4")
	conn, err := sql.Open("mysql", url)
	if err != nil {
		return nil, err
	}
	connector := &MariaDBConn{
		Host:     host,
		Port:     port,
		User:     user,
		Password: password,
		DBName:   dbname,
		Charset:  "utf8mb4",
		URI:      url,
		DB:       conn,
	}
	return connector, err
}

func (p *MariaDBConn) ChangePassword(user, host, password string) error {
	sql := fmt.Sprintf("set password for %s@%s = password('%s');", user, host, password)
	_, err := p.DB.Query(sql)
	return err
}

func (p *MariaDBConn) CreateUser(user, host, password string) error {
	sql := fmt.Sprintf("CREATE USER '%s'@'%s' identified by '%s';", user, host, password)
	_, err := p.DB.Query(sql)
	return err
}

func (p *MariaDBConn) Grant(user, host, privileges string) error {
	sql := fmt.Sprintf("GRANT %s ON *.* TO '%s'@'%s';", privileges, user, host)
	_, err := p.DB.Query(sql)
	return err
}

func (p *MariaDBConn) ChangeMasterTo(host string, port int, user, password string) error {
	sql := fmt.Sprintf("CHANGE MASTER TO MASTER_HOST='%s', MASTER_PORT=%d, MASTER_USER='%s', MASTER_PASSWORD='%s', MASTER_USE_GTID='current_pos';",
		host,
		port,
		user,
		password)
	_, err := p.DB.Query(sql)
	return err
}

func (p *MariaDBConn) ShowSlaveStatus() (status map[string]sql.NullString, err error) {
	sql := "SHOW SLAVE STATUS;"
	rows, err := p.DB.Query(sql)
	if err != nil {
		return status, err
	}

	return ScanMap(rows)
}

```