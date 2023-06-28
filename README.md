# authen-server
Các bước setup authen-server:

    1. Cài docker
    2. Clone repo authen-server
    3. Tạo file .env
    4. Tải file zidenjs đăt trong thư mục pkg
    5. Chạy `npm i` để cài thư viện
    6. Tải các thư mục db và build
    7. Chạy các câu lệnh đã được thiết lập trong makefile:
        a. `make build-image`: Build lại image của authen-server khi thay đổi file .env
        b. `make up`: Chạy authen-server dưới dạng hot reload để dev (detach)
        c. `make up-prod`: Chạy authen server ở dạng prod (detach)
        d. `make down`: Tắt authen server
