#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
用于检查API服务器状态的简单脚本
"""

import requests
import sys

def check_server(base_url):
    """检查服务器是否在线"""
    try:
        # 尝试访问检查端点
        response = requests.get(f"{base_url}/check", timeout=5)
        if response.status_code == 200:
            print(f"✅ 服务器在线，响应: {response.json()}")
            return True
        else:
            print(f"❌ 服务器返回错误状态码: {response.status_code}")
            return False
    except requests.exceptions.ConnectionError:
        print(f"❌ 无法连接到服务器 {base_url}")
        return False
    except Exception as e:
        print(f"❌ 检查服务器时出错: {str(e)}")
        return False

if __name__ == "__main__":
    # 检查两个可能的端口
    server_urls = ["http://localhost:5001/api", "http://localhost:5002/api"]

    any_server_running = False

    for url in server_urls:
        print(f"正在检查 {url}...")
        if check_server(url):
            any_server_running = True

    if not any_server_running:
        print("\n没有发现运行中的服务器。请启动服务器:")
        print("cd backend/api")
        print("python server.py")
        sys.exit(1)

    sys.exit(0)
