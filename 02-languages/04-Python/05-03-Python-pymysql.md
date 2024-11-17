
```python
#!/usr/local/yun/.venv/bin/python3
# -*- coding:utf-8 -*-
# @Author: lsne
# @Date: 2023-12-22 18:46:00

import json
import os
import pymysql
import rados
from prettytable import PrettyTable
from exchangelib import DELEGATE, Account, Credentials, Configuration, NTLM, Message, Mailbox, HTMLBody


class Mysql():
    """ MySQL 单个实例 """

    def __init__(self,
                 hostname,
                 port,
                 user,
                 password,
                 dbname="",
                 charset="utf8mb4"):
        self.hostname = hostname
        self.port = port
        self.user = user
        self.password = password
        self.dbname = dbname
        self.charset = charset
        self.conn = self.get_conn()

    def get_conn(self):
        """ 获取连接 """
        conn = None
        try:
            conn = pymysql.connect(host=self.hostname,
                                   port=self.port,
                                   user=self.user,
                                   password=self.password,
                                   db=self.dbname,
                                   charset=self.charset)
        except pymysql.Error as err:
            raise ValueError(
                f'Unable to connect {self.hostname}:{self.port}, exception: {err}'
            ) from err
        return conn

    def fetchall(self, sql, data=None):
        """ 执行SQL语句 """
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(sql, data)
                return cursor.fetchall()
        except pymysql.Error as err:
            raise ValueError(
                f'sql exec failed: {sql}; exception: {err}') from err

    def fetchone(self, sql, data=None):
        """ 执行SQL语句, 返回字典 """
        try:
            with self.conn.cursor() as cursor:
                cursor.execute(sql, data)
                res = cursor.fetchone()
                if res is None:
                    return {}
                return dict(zip([k[0] for k in cursor.description], res))
        except pymysql.Error as err:
            raise ValueError(
                f'sql exec failed: {sql}; exception: {err}') from err

    def get_ceph_cluster_osd_hosts(self, name):
        """ 获取 mon 节点 """
        sql = f'select t.name from t1 t where t.name = {name};'
        res = self.fetchall(sql)
        return list(i[0] for i in res)
```