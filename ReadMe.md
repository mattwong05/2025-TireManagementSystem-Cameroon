# 喀麦隆重型卡车轮胎管理系统

本仓库提供一套面向 ≤1000 辆 18 轮 + 2 备胎重型卡车车队的轮胎全生命周期管理解决方案，包含 FastAPI 后端与 React + Vite 前端。系统满足高频安装/卸下/查询操作、移动优先界面、多语言与明暗主题切换等需求，并针对喀麦隆网络环境进行了本地缓存和批量提交优化。

## 架构总览

```
┌────────────────┐       REST API        ┌───────────────────────────┐
│ React Frontend │  <------------------> │ FastAPI Backend + SQLite │
└────────────────┘                       └───────────────────────────┘
        │                                              │
        │                                              └── 身份认证 (JWT + bcrypt)
        └── Axios 调用 + 本地状态缓存                  └── 车辆/轮位/轮胎数据模型
```

- **前端**：使用 Vite + React + TypeScript + Tailwind，内置 i18n（中/英）与明暗主题切换，移动端优先布局，车牌列表采用喀麦隆黑字橙底样式，轮位布局参考提供的 Demo。
- **后端**：使用 FastAPI + SQLAlchemy + SQLite（默认），支持车辆管理、轮位轮胎安装/卸下、批量更新，基于 OAuth2 密码模式 + JWT 的简单认证，Passlib bcrypt 存储密码。
- **测试**：提供基于 pytest 的后端接口测试用例，覆盖登录、车辆生命周期、轮位操作与模糊搜索。

## 功能要点

### 车辆 & 轮位
- 支持录入最多 1000 辆车辆，自动生成 20 个固定轮位（18 个在用 + 2 个备胎）。
- 前端提供轮位可视化布局，可选择任意轮位查看/编辑轮胎编号。
- 支持批量保存轮位变更，减少网络请求次数。

### 轮胎编号管理
- 每个轮位显示当前轮胎编号及状态。
- 轮位详情面板支持扫描/输入编号、安装、卸下操作。
- 支持批量提交，满足 ≥10,000 次/日的高频操作需求。

### 车牌列表与搜索
- 左侧列表展示全部车辆，车牌卡片遵循喀麦隆黑字橙底样式与比例。
- 支持模糊搜索（如输入 `123` 将匹配 `AB 123 CD`）。
- 移动端提供抽屉式车辆列表，桌面端固定展示。

### 多语言 & 主题
- 根据浏览器语言自动选择中文或英文，可手动切换。
- 跟随系统的明暗主题，可手动切换 Light/Dark/System。
- 所有界面组件在两种语言与主题下均保持良好对比度与可读性。

### 性能优化
- 前端本地缓存已加载车辆与轮位，避免重复请求。
- 轮位批量保存接口一次提交所有变更，减少高频网络往返。
- 界面操作提供提示与错误反馈，弱网环境下更友好。

## 环境要求

- **后端**：Python 3.11+，pip；默认使用 SQLite，如需其他数据库可通过 `DATABASE_URL` 环境变量覆盖。
- **前端**：Node.js 18+，npm。
- **系统**：Ubuntu 22.04/20.04 (2 CPU / 2GB RAM / 20GB Disk) 经验证可部署运行。

## 快速开始

### 1. 克隆仓库
```bash
git clone https://example.com/2025-TireManagementSystem-Cameroon.git
cd 2025-TireManagementSystem-Cameroon
```

### 2. 后端部署

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r requirements.txt

# 初始化数据库并创建默认管理员账号（用户名 admin / 密码 admin123，可通过环境变量覆盖）
python -m app.init_db

# 启动 FastAPI 服务
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

- API 文档：访问 `http://<服务器IP>:8000/docs`
- 健康检查：`http://<服务器IP>:8000/health`

> 若部署在生产环境，建议：
> - 修改 `SECRET_KEY`、`DEFAULT_ADMIN_USERNAME`、`DEFAULT_ADMIN_PASSWORD` 环境变量；
> - 使用持久化数据库（PostgreSQL/MySQL）并更新 `DATABASE_URL`；
> - 使用反向代理（Nginx）提供 HTTPS。

### 3. 前端部署

```bash
cd frontend
npm install
npm run build  # 生成生产静态资源
```

- 生成的静态文件位于 `frontend/dist`，可使用任意静态服务器托管（Nginx、Caddy 等）。
- 开发模式可运行：
  ```bash
  npm run dev -- --host 0.0.0.0 --port 5173
  ```
-  默认前端通过 `VITE_API_BASE_URL` 环境变量（默认 `http://localhost:8000`）调用后端，可复制 `frontend/.env.example` 为 `.env` 后按需自定义。

### 4. systemd + Nginx 生产部署指引

下列方案基于 **Ubuntu 22.04**，假设仓库位于 `/opt/tire-system`。

#### 4.1 创建运行用户与目录

```bash
sudo useradd --system --create-home --shell /usr/sbin/nologin tiresvc
sudo mkdir -p /opt/tire-system
sudo chown tiresvc:tiresvc /opt/tire-system

# 将代码同步到 /opt/tire-system，例如使用 rsync / scp / git clone
sudo -u tiresvc git clone https://example.com/2025-TireManagementSystem-Cameroon.git /opt/tire-system
```

#### 4.2 后端虚拟环境与配置

```bash
sudo -u tiresvc python3 -m venv /opt/tire-system/backend/.venv
sudo -u tiresvc /opt/tire-system/backend/.venv/bin/pip install --upgrade pip
sudo -u tiresvc /opt/tire-system/backend/.venv/bin/pip install -r /opt/tire-system/backend/requirements.txt

# 根据需要写入环境变量
sudo tee /etc/2025-tire-backend.env >/dev/null <<'EOF'
SECRET_KEY=请替换为随机字符串
DATABASE_URL=sqlite:////opt/tire-system/backend/data.sqlite3
DEFAULT_ADMIN_USERNAME=admin
DEFAULT_ADMIN_PASSWORD=更安全的密码
VITE_ALLOWED_ORIGINS=https://tire.example.com
EOF

sudo chown tiresvc:tiresvc /etc/2025-tire-backend.env
sudo chmod 640 /etc/2025-tire-backend.env

# 初始化数据库
sudo -u tiresvc bash -lc '
  export $(cat /etc/2025-tire-backend.env | xargs)
  cd /opt/tire-system/backend
  .venv/bin/python -m app.init_db
'
```

#### 4.3 systemd 服务模板

创建 `/etc/systemd/system/tire-backend.service`：

```ini
[Unit]
Description=Tire Management System FastAPI backend
After=network.target
Wants=network-online.target

[Service]
Type=simple
User=tiresvc
Group=tiresvc
WorkingDirectory=/opt/tire-system/backend
EnvironmentFile=/etc/2025-tire-backend.env
ExecStart=/opt/tire-system/backend/.venv/bin/uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4 --proxy-headers --root-path /api
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
```

启用并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now tire-backend.service
sudo systemctl status tire-backend.service
```

日志查看：`journalctl -u tire-backend.service -f`

#### 4.4 前端构建与 Nginx 部署

```bash
sudo -u tiresvc npm --prefix /opt/tire-system/frontend install
sudo -u tiresvc npm --prefix /opt/tire-system/frontend run build

# dist 目录将生成在 /opt/tire-system/frontend/dist
```

创建 `/etc/nginx/sites-available/tire-frontend.conf`：

```nginx
server {
    listen 80;
    server_name tire.example.com;

    root /opt/tire-system/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:8000/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

启用站点并重启 Nginx：

```bash
sudo ln -s /etc/nginx/sites-available/tire-frontend.conf /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

如需 HTTPS，可使用 [Certbot](https://certbot.eff.org/) 为该站点签发证书。

#### 4.5 常见维护命令

- 更新后端依赖：`sudo -u tiresvc /opt/tire-system/backend/.venv/bin/pip install -r /opt/tire-system/backend/requirements.txt`
- 重新加载服务：`sudo systemctl restart tire-backend.service`
- 查看前端构建版本：`ls -lt /opt/tire-system/frontend/dist`
- Nginx 日志：`/var/log/nginx/access.log`、`/var/log/nginx/error.log`

### 5. 运行测试

```bash
cd backend
pytest
```

测试会在内存数据库中运行，不会污染生产数据。

## 目录结构

```
backend/
  app/
    main.py           # FastAPI 入口与路由
    crud.py           # 数据库操作封装
    models.py         # SQLAlchemy 模型定义
    schemas.py        # Pydantic 模型 & 常量
    security.py       # JWT & 密码加密
    deps.py           # 依赖注入（数据库、认证）
    database.py       # 数据库引擎初始化
    init_db.py        # 初始化脚本（创建默认管理员）
  requirements.txt
  tests/
    test_api.py       # 核心接口测试
frontend/
  src/
    components/       # UI 组件（仪表盘、车辆列表、轮位布局等）
    contexts/         # 认证 & 主题上下文
    locales/          # i18n 文案
    api/              # Axios 客户端
    App.tsx, main.tsx
  package.json, vite.config.ts, tailwind.config.js
ReadMe.md
```

## 默认账号

| 用户名 | 密码     | 说明         |
| ------ | -------- | ------------ |
| admin  | admin123 | 初始化管理员 |

> 建议首次登录后立即在数据库中修改密码，并创建符合组织安全策略的账号。

## 常见问题 (FAQ)

1. **如何支持超过 1000 辆车？**
   - 可在 `backend/app/schemas.py` 中调整 `MAX_VEHICLES`，并根据需要扩展数据库与分页策略。
2. **是否支持角色权限？**
   - 当前版本所有用户权限一致，代码已预留 `User` 模型扩展字段，可在未来加入角色管理与细粒度授权。
3. **如何接入外部身份系统？**
   - 可在登录接口中替换/扩展现有认证逻辑，例如接入公司 SSO 或 OAuth2 Provider。

如需进一步定制或扩展，请根据业务需求修改对应模块并补充测试。
