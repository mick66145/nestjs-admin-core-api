# nestjs-admin-core-api

## 佈署流程

### 前置流程
1. 確認APP_PATH是否為專案路徑

2. 執行 compose.db
    ```
    docker compose -f compose.db.yaml up -d
    ```

### 初次佈署
1. 產生Docker Image
    ```
    make buAll
    ```

2. 執行編譯
    ```
    make genAll
    ```

3. 執行migrate，執行前請先確認APP_NETWORK是否設定正確
    ```
    make migrateDeploy
    ```
4. 複製到deploy專案底下
    ```
    make deployApp
    ```
5. 確認微服務執行環境  
    - 單一微服務環境，執行前請先確認.env是否設定完成
        ```
        docker compose up -d
        ```

5. 佈署完成

### 更新佈署(單一微服務環境)

1. 使用git更新檔案

2. 如果image not found 
    ```
    make buDev
    ```

3. 確認更新檔案，執行編譯  
    - 只有更新ts檔案
        ```
        make genDist
        ```
    - 有更新Database Schema
        ```
        make migrateDeploy
        make genAll
        ```
4. 複製到deploy專案底下
    ```
    make deployApp
    ```

4. 重啟容器
    ```
    docker restart {CONTAINER_ID}
    ```
    P.S. 如果有更新project的.env，需先關閉容器後再啟動，不然更新後的.env不會生效
    ```
    docker stop {CONTAINER_ID} && docker compose up -d
    ```
    or
    ```
    docker compose down && docker compose up -d
    ```

5. 更新完成