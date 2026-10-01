@echo off
cd /d c:\Users\yangz\CodeBuddy\20260715051946\kaifa\backend
for /f %%i in ('node -e "const {signToken}=require('./src/config/jwt');console.log(signToken({id:99,username:'test',role:'admin',role_id:2,roleId:2,permissions:['order:write']},'7d'))"') do set T=%%i
curl.exe -s -o NUL -w "settings(403?):%{http_code} " -H "Authorization: Bearer %T%" http://localhost:3000/api/admin/settings
curl.exe -s -o NUL -w "orders(403?):%{http_code} " -H "Authorization: Bearer %T%" http://localhost:3000/api/admin/orders
curl.exe -s -o NUL -w "order-create(200?):%{http_code}" -X POST -H "Authorization: Bearer %T%" -H "Content-Type: application/json" -d "{\"title\":\"t\"}" http://localhost:3000/api/admin/orders
echo.
