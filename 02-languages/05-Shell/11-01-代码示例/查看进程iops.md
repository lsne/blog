
```shell
#!/usr/bin/env bash
# Created by lsne on 2023-01-13 10:55:00

pid=$1

cat /proc/${pid}/io > ${pid}.io
pre_rio=$(cat ${pid}.io | grep "syscr" | awk '{print $2}')
pre_wio=$(cat ${pid}.io | grep "syscw" | awk '{print $2}')

for i in {1..100};do
    sleep 1s
    cat /proc/${pid}/io > ${pid}.io
    aft_rio=$(cat ${pid}.io | grep "syscr" | awk '{print $2}')
    aft_wio=$(cat ${pid}.io | grep "syscw" | awk '{print $2}')
    echo "read iops: $(($aft_rio - $pre_rio)) write ipos: $(($aft_wio - $pre_wio))"
    pre_rio=${aft_rio}
    pre_wio=${aft_wio}
done
```