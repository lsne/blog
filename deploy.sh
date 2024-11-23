#!/usr/bin/env bash
# @Author: lsne
# @Date: 2024-11-23 17:00:45

[[ $(basename "$(pwd)") == "blog" ]] || { echo "当前目录必须是 blog 目录"; exit 2; }
rm -rf 01-tools  02-languages  03-databases  04-kubernetes  05-linux || exit 2
cp -r ../notes/01-tools ../notes/02-languages ../notes/03-databases ../notes/04-kubernetes ../notes/05-linux . || exit 2
rm -rf 02-languages/03-Go/11-01-代码示例 \
    02-languages/05-Shell/11-01-代码示例 \
    02-languages/06-Node.js/11-01-代码示例 \
    03-databases/00-00-各库监控指标.md \
    03-databases/02-MySQL/21-01-MySQL-多源复制.md \
    03-databases/02-MySQL/99-01-MySQL-切主流程.md