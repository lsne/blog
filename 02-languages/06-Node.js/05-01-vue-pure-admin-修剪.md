# vue-pure-admin 修剪

### 使用精简包

```shell
https://github.com/pure-admin/pure-admin-thin.git
```

### 整体布局

#### 克隆精简包仓库

```shell
git clone https://github.com/pure-admin/pure-admin-thin.git
```

#### 修改登录页面矢量图

**替换文件: `src/assets/login/illustration.svg`**

#### 设置参数

> 文件: `public/platform-config.json`

修改以下参数:

```json
{
  "Version": "5.7.0",
  "Title": "数据提取平台",
  "FixedHeader": true,
  "HiddenSideBar": false,
  "HideTabs": true,
  "HideFooter": false,
  "Stretch": false,
  "SidebarStatus": true,
  "ShowLogo": true,
}
```

#### 关闭系统设置按钮

> 文件: `web/src/layout/index.vue`

注释以下行:

```vue
<!-- 系统设置 -->
<!-- <LaySetting /> -->
```

### 修改 API 接口地址
#### 删除 mock 数据

> 文件: `build/plugins.ts`

注释以下行:

```ts
// import { vitePluginFakeServer } from "vite-plugin-fake-server";
...
// mock支持
// vitePluginFakeServer({
//   logger: false,
//   include: "mock",
//   infixName: false,
//   enableProd: true
// }),
```

#### 设置代理到后端 api server

> 文件: `vite.config.ts`

添加以下内容:

```ts
proxy: {
	// "/api" 表示后端api统一的前缀, 有可能是"/api","/api/v1"等
	"/api": {
	  // 这里填写后端地址
	  target: "http://api.ls.cn:8080",
	  changeOrigin: true
	  // 如果后端api没有统一的前缀, 则可以随机编写一个前缀(如: api)。前端api请求时全部添加上这个前缀, 而实际请求后端时, 会在这里使用 rewrite 将前缀去掉
	  // rewrite: path => path.replace(/^\/api/, "")
	}
  },
```

#### 添加 api utils 工具包

> 创建新文件: `src/api/utils.ts`

```ts
export const baseUrlApi = (url: string) => `/v1${url}`;
```

#### 使用 api utils 工具包

> 示例文件: `src/api/user.ts`

```ts
import { baseUrlApi } from "./utils";
...
/** 登录 */
export const getLogin = (data?: object) => {
  return http.request<UserResult>(
    "post",
    baseUrlApi("/auth/user/sqlweb/login"),
    {
      data
    }
  );
};

/** 获取数据 */
export const queryData = (data?: object) => {
  return http.request<QueryDataResult>(
    "post",
    baseUrlApi("/mysql/data/query"),
    { data },
    { timeout: 1000000 } // 这里可以设置 Axios 相关参数, 例: 请求超时 1000 秒
  );
};

```

### 修改 Token 相关

#### 修改后端 Token 名, 秒级时间戳

> 文件: `src/utils/auth.ts`

```ts
export const TokenKey = "X-Token";  // Token 名
...
export function setToken(data: DataInfo<number>) {
  let expires = 0;
  const { accessToken, refreshToken } = data;
  const { isRemembered, loginDay } = useUserStoreHook();
  expires = data.expires * 1000; // 后端返回秒级时间戳
  const cookieString = JSON.stringify({ accessToken, expires, refreshToken });
```

#### 修改后端请求头和不使用token的接口白名单

> 文件: `/src/utils/http/index.ts`

```ts
  /** 重连原始请求 */
  private static retryOriginalRequest(config: PureHttpRequestConfig) {
    return new Promise(resolve => {
      PureHttp.requests.push((token: string) => {
        // config.headers["Authorization"] = formatToken(token);
        config.headers["X-Token"] = token; // 修改1
        resolve(config);
      });
    });
  }

  /** 请求拦截 */
  private httpInterceptorsRequest(): void {
    PureHttp.axiosInstance.interceptors.request.use(
      async (config: PureHttpRequestConfig): Promise<any> => {
        // 开启进度条动画
        NProgress.start();
        // 优先判断post/get等方法是否传入回调，否则执行初始化设置等回调
        if (typeof config.beforeRequestCallback === "function") {
          config.beforeRequestCallback(config);
          return config;
        }
        if (PureHttp.initConfig.beforeRequestCallback) {
          PureHttp.initConfig.beforeRequestCallback(config);
          return config;
        }
        /** 请求白名单，放置一些不需要`token`的接口（通过设置请求白名单，防止`token`过期后再请求造成的死循环问题） */
        const whiteList = [
          "/v1/auth/user/sqlweb/refresh-token",
          "/v1/auth/user/sqlweb/login"
        ]; // 修改2: 白名单接口
        return whiteList.some(url => config.url.endsWith(url))
          ? config
          : new Promise(resolve => {
              const data = getToken();
              if (data) {
                const now = new Date().getTime();
                const expired = parseInt(data.expires) - now <= 0;
                if (expired) {
                  if (!PureHttp.isRefreshing) {
                    PureHttp.isRefreshing = true;
                    // token过期刷新
                    useUserStoreHook()
                      .handRefreshToken({ refreshToken: data.refreshToken })
                      .then(res => {
                        const token = res.data.accessToken;
                        // config.headers["Authorization"] = formatToken(token);
                        config.headers["X-Token"] = token; // 修改3
                        PureHttp.requests.forEach(cb => cb(token));
                        PureHttp.requests = [];
                      })
                      .finally(() => {
                        PureHttp.isRefreshing = false;
                      });
                  }
                  resolve(PureHttp.retryOriginalRequest(config));
                } else {
	              // config.headers["Authorization"] = formatToken(
                  //   data.accessToken
                  // );
                  config.headers["X-Token"] = data.accessToken; // 修改4
                  resolve(config);
                }
              } else {
                resolve(config);
              }
            });
      },
      error => {
        return Promise.reject(error);
      }
    );
  }
```

#### 修改免登录参数

> 文件: `src/store/modules/user.ts`

```ts
// 是否勾选了登录页的免登录
isRemembered: true,

// 或者通过登录页面勾选, 调用以下函数
/** 存储是否勾选了登录页的免登录 */
SET_ISREMEMBERED(bool: boolean) {
  this.isRemembered = bool;
},
```

### 修改页面

#### 修改登录页面

> 文件: `src/views/login/index.vue`

```ts
// 将页面上默认填充置空
const ruleForm = reactive({
  username: "",
  password: ""
});

const onLogin = async (formEl: FormInstance | undefined) => {
  if (!formEl) return;
  await formEl.validate((valid, fields) => {
    if (valid) {
      loading.value = true;
      useUserStoreHook()
        .loginByUsername({
          username: ruleForm.username,
          password: ruleForm.password
        })
        .then(res => {
          // 将后端情况返回值通过 res.errno 判断是否成功
          if (res.errno == 0) {
            // 获取后端路由
            return initRouter().then(() => {
              router.push(getTopMenu(true).path).then(() => {
                message("登录成功", { type: "success" });
              });
            });
          } else {
            message("登录失败", { type: "error" });
          }
        })
        .finally(() => (loading.value = false));
    }
  });
};
```

#### 修改权限页面

> 文件: `src/views/permission/page/index.vue`

```ts
function onChange() {
  useUserStoreHook()
    .loginByUsername({ username: username.value, password: "123456" })
    .then(res => {
      // 将后端情况返回值通过 res.errno 判断是否成功
      if (res.errno == 0) {
        storageLocal().removeItem("async-routes");
        usePermissionStoreHook().clearAllCachePage();
        initRouter();
      }
    });
}
```

#### 页面边距

```vue
<excel
      class="w-[99/100] mt-2 px-2 pb-2 bg-bg_color"
      :qheader="qheader"
      :qdata="qdata"
      :form="form"
    />
```

### 工具函数

#### watch 监视时延迟触发

```ts
// timeoutId 表示监视器的延迟执行句柄, 有新输入会取消延迟操作并重新设置延迟
let timeoutId = 0;
watch(() => form.port,newValue => {
    if (timeoutId !== 0) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      getInsInfoByPort(newValue);
    }, 1000);
  }
);
```

### nginx 配置代理转发api接口

> `vim /etc/nginx/conf.d/sqlweb.conf`

```nginx
server {
        listen       8866;
        server_name  sqlweb.web.ls.cn 10.249.216.17;
        location / {
            root /usr/local/sqlweb/web;
            index index.html;
        }
location /v1 {
    # 如果后端在本地比如127.0.0.1或者localhost请解开下面的rewrite注释即可
    # rewrite  ^.+api/?(.*)$ /$1 break;
    # 这里填写后端地址（后面一定不要忘记添加 / ）
    proxy_pass http://sqlweb.api.ls.cn:8080;
    proxy_set_header Host $host;
    proxy_set_header Cookie $http_cookie;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_redirect default;
    add_header Access-Control-Allow-Origin *;
    add_header Access-Control-Allow-Headers X-Requested-With;
    add_header Access-Control-Allow-Methods GET,POST,OPTIONS;
	}
}
```