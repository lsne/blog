# git-pre-commit

```sh
#!/bin/sh
STAGED_GO_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep ".go$")
VETPACKAGES=`go list ./...`
PASS=true

if [[ "$STAGED_GO_FILES" = ""  ]]; then
    exit 0
fi

# go vet 检查代码中的静态错误
function go_vet(){
    curDir=`basename $PWD`
    vetDirs=""
    for FILE in $STAGED_GO_FILES;do
        package=`dirname ${FILE}`
        vetDirs=$vetDirs" "${curDir}/${package}
        #go vet --composites=false ${curDir}/${package}
        #if [[ $? != 0 ]]; then
        #    PASS=false
        #    break
        #fi
    done
    go vet --composites=false ${vetDirs}
    if [[ $? != 0 ]]; then
        PASS=false
    fi
    if ! $PASS; then
        printf "\033[31m COMMIT FAILED \033[0m\n"
        exit 1
    else
        printf "\033[32m COMMIT SUCCEEDED \033[0m\n"
    fi
}

# fmt and goimports file 
function go_fmt_and_import(){
    for FILE in $STAGED_GO_FILES
    do
        # goimports 检查并调整导入语句
#        goimports -w $FILE
#        if [[ $? != 0  ]]; then
#            PASS=false
#        fi

        # go fmt file 
        UNFORMATTED=$(gofmt -l $FILE)
        if [[ "$UNFORMATTED" != ""  ]];then
            gofmt -w $PWD/$UNFORMATTED
            if [[ $? != 0  ]]; then
                PASS=false
            fi
        fi 

        git add $FILE
        

        #golint 检查代码风格,给出提示
        #golint "-set_exit_status" $FILE
        #if [[ $? == 1  ]]; then
        #    PASS=false
        #fi
    done 

    if ! $PASS; then
        printf "\033[31m COMMIT FAILED \033[0m\n"
        exit 1
    else
        printf "\033[32m COMMIT SUCCEEDED \033[0m\n"
    fi
}

go_vet 

go_fmt_and_import

exit 0
```