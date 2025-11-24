#!/bin/bash

# 清除屏幕
clear

# 显示欢迎信息
echo "欢迎使用厕所收费服务"
echo "大哥国际厕所公司开发 仅供娱乐 请勿当真"
uname -a
echo "------------------------"
echo

# 第一步：扫码登录/模拟登录
echo "请扫码登录"
echo "二维码：加载失败"
echo "模拟登录请输入：LocalLogin"
echo

# 读取用户输入
read -p "请输入: " login_input

# 检查是否是模拟登录
if [ "$login_input" != "LocalLogin" ]; then
    echo "登录失败！请输入正确的模拟登录命令。"
    exit 1
fi

echo
echo "登录成功！"
echo

# 第二步：询问如厕时间
read -p "请输入如厕时间(min): " time_input

# 验证输入是否为数字
if ! [[ "$time_input" =~ ^[0-9]+$ ]]; then
    echo "请输入有效的数字！"
    exit 1
fi

# 确认如厕时间
echo
read -p "确认如厕时间为 ${time_input} 分钟？(y/n): " confirm

if [ "$confirm" != "y" ]; then
    echo "操作已取消！"
    exit 1
fi

# 计算费用（假设每分钟1元）
fee=$time_input

# 显示费用
echo
echo "共计 ${fee} 元"
echo

# 询问是否支付
read -p "是否支付？(y/n): " pay_confirm

if [ "$pay_confirm" != "y" ]; then
    echo "支付已取消！"
    exit 1
fi

# 支付成功
echo
echo "支付成功！"
echo
echo "马桶开盖"
echo

# 显示当前时间
current_time=$(date "+%Y-%m-%d %H:%M:%S")
echo "时间：$current_time"
echo
echo "请使用厕所，祝您如厕愉快！"