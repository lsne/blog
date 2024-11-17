
```python
class Ceph():
    """ Ceph 连接 ceph 集群 """

    def __init__(self, cluster_name, mons, name, keyring):
        self.cluster_name = cluster_name
        self.mons = mons
        self.name = name
        self.keyring = keyring
        self.conn = self.get_conn()

    def get_conn(self):
        """ 获取连接 """
        mon_host = ""
        # 兼容 那个 L 版的 oss-shyc3-cdn 集群
        if self.cluster_name == "oss-shyc3-cdn":
            for mon in self.mons:
                mon_host += "[v1:{0}:6789/0] ".format(mon[1])
            # mon_host = ','.join(self.mons)
        else:
            for mon in self.mons:
                mon_host += "[v2:{0}:3300/0,v1:{0}:6789/0] ".format(mon[1])

        conn = rados.Rados(name=self.name, conf={"mon_host": mon_host, "keyring": self.keyring})
        # connect 里的 timeout 好像不管用
        conn.connect(timeout=10)
        return conn

    def mon_command(self, cmd, inbuf=b'', timeout=10, target=None):
        """ 执行 ceph mon 命令 """
        cmd = json.dumps({"prefix": cmd,"format": "json"})
        code, data, error = self.conn.mon_command(cmd, inbuf, timeout, target)
        if code != 0:
            print("执行: {} 失败, 错误码: {} 错误信息: {}".format(cmd, code, error))
            return {}
        return json.loads(data)

    def status(self):
        return self.mon_command("status")
    
    def mgr_dump(self):
        return self.mon_command("mgr dump")
    
    def quorum_status(self):
        return self.mon_command("quorum_status")
    
    def osd_lspools(self):
        return self.mon_command("osd lspools")
    
    def osd_tree(self):
        return self.mon_command("osd tree")
    
    def osd_df(self):
        return self.mon_command("osd df")

    def osd_metadata(self):
        return self.mon_command("osd metadata")

    def node_ls(self):
        return self.mon_command("node ls")
```