# Web3 Voting DApp | Web3 投票系统

[English](#english) | [中文](#中文)

---

<a name="english"></a>
## English

A decentralized voting system built with Solidity, Go, and React. This application allows users to create custom voting polls, assign voting power, and execute votes on the blockchain.

### 📁 Project Structure

```
voting-dapp/
├── contracts/           # Smart Contracts (Solidity + Hardhat)
│   ├── src/
│   │   └── Voting.sol   # Main voting contract
│   ├── test/
│   │   └── Voting.test.js
│   ├── scripts/
│   │   └── deploy.js
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/             # Go Backend API
│   ├── cmd/server/
│   │   └── main.go
│   ├── internal/
│   │   ├── api/         # HTTP handlers
│   │   ├── blockchain/  # Ethereum client
│   │   ├── config/      # Configuration
│   │   └── models/      # Data models
│   ├── pkg/ethclient/
│   ├── go.mod
│   └── .env.example
│
└── frontend/            # React Frontend
    ├── src/
    │   ├── components/  # UI components
    │   ├── hooks/       # Custom hooks
    │   ├── pages/       # Page components
    │   └── utils/       # Utilities
    ├── public/
    ├── package.json
    └── vite.config.js
```

### 🚀 Quick Start

#### Prerequisites

- Node.js >= 18
- Go >= 1.21
- MetaMask or other Web3 wallet

#### 1. Deploy Smart Contract

```bash
cd contracts

# Install dependencies
npm install

# Compile contract
npm run compile

# Start local Hardhat node (in a separate terminal)
npm run node

# Deploy to local network
npm run deploy:local
```

Save the deployed contract address from `deployment.json`.

#### 2. Start Backend

```bash
cd backend

# Copy and configure environment
cp .env.example .env

# Edit .env with your settings:
# - ETH_RPC_URL=http://127.0.0.1:8545
# - CONTRACT_ADDRESS=<deployed_contract_address>
# - ADMIN_PRIVATE_KEY=<admin_private_key>

# Download dependencies
go mod tidy

# Run server
go run cmd/server/main.go
```

The backend server will start on `http://localhost:8080`.

#### 3. Start Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Access the application at **http://localhost:5173**

### 📋 API Endpoints

#### Polls

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/polls` | Get all polls |
| GET | `/api/polls/:id` | Get poll by ID |
| GET | `/api/polls/:id/results` | Get poll results |
| GET | `/api/polls/:id/status` | Get poll status |
| POST | `/api/polls` | Create new poll |
| POST | `/api/polls/:id/cancel` | Cancel poll |
| POST | `/api/polls/:id/activate` | Activate poll |
| POST | `/api/polls/:id/deactivate` | Deactivate poll |

#### Voting

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/votes` | Cast a vote |
| GET | `/api/votes/:pollId/voter/:address` | Get voter status |

#### Admin

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/voting-power/:address` | Get voting power |
| POST | `/api/voting-power/assign` | Assign voting power |
| POST | `/api/voting-power/assign-batch` | Batch assign voting power |

### 🔧 Smart Contract Features

| Feature | Description |
|---------|-------------|
| **Create Polls** | Custom title, description, multiple options, start/end time |
| **Voting Power** | Admin-assigned voting weights for each address |
| **Vote Tracking** | Prevent double voting per poll |
| **Status Management** | Active, Inactive, Canceled, Pending, Ended |
| **Real-time Results** | Live vote counts and percentages |

### 🛠️ Technology Stack

| Layer | Technology |
|-------|------------|
| Smart Contract | Solidity 0.8.19, Hardhat |
| Backend | Go 1.21, Gin, go-ethereum |
| Frontend | React 18, Vite, TailwindCSS, ethers.js |
| Network | Ethereum (Local/Sepolia/Goerli) |

### 📝 Usage Flow

1. **Admin** assigns voting power to addresses via Admin Panel
2. **Creator** creates a new poll with options and time range
3. **Voters** connect MetaMask wallet and cast votes
4. **Everyone** can view real-time results on poll detail page

### 🔐 Security Notes

- Only contract admin can assign voting power
- Each voter can vote only once per poll
- Voting power must be greater than 0 to vote
- Poll must be active and within the specified time range

### 📜 License

MIT License

---

<a name="中文"></a>
## 中文

一个基于 Solidity、Go 和 React 构建的去中心化投票系统。该应用允许用户创建自定义投票、分配投票权，并在区块链上执行投票。

### 📁 项目结构

```
voting-dapp/
├── contracts/           # 智能合约 (Solidity + Hardhat)
│   ├── src/
│   │   └── Voting.sol   # 投票合约主文件
│   ├── test/
│   │   └── Voting.test.js
│   ├── scripts/
│   │   └── deploy.js
│   ├── hardhat.config.js
│   └── package.json
│
├── backend/             # Go 后端 API
│   ├── cmd/server/
│   │   └── main.go      # 入口文件
│   ├── internal/
│   │   ├── api/         # HTTP 处理器
│   │   ├── blockchain/  # 以太坊客户端
│   │   ├── config/      # 配置管理
│   │   └── models/      # 数据模型
│   ├── pkg/ethclient/
│   ├── go.mod
│   └── .env.example
│
└── frontend/            # React 前端
    ├── src/
    │   ├── components/  # UI 组件
    │   ├── hooks/       # 自定义 Hooks
    │   ├── pages/       # 页面组件
    │   └── utils/       # 工具函数
    ├── public/
    ├── package.json
    └── vite.config.js
```

### 🚀 快速开始

#### 环境要求

- Node.js >= 18
- Go >= 1.21
- MetaMask 或其他 Web3 钱包

#### 1. 部署智能合约

```bash
cd contracts

# 安装依赖
npm install

# 编译合约
npm run compile

# 启动本地 Hardhat 节点（在单独的终端中）
npm run node

# 部署到本地网络
npm run deploy:local
```

保存 `deployment.json` 中部署的合约地址。

#### 2. 启动后端服务

```bash
cd backend

# 复制并配置环境变量
cp .env.example .env

# 编辑 .env 文件：
# - ETH_RPC_URL=http://127.0.0.1:8545
# - CONTRACT_ADDRESS=<部署的合约地址>
# - ADMIN_PRIVATE_KEY=<管理员私钥>

# 下载依赖
go mod tidy

# 运行服务
go run cmd/server/main.go
```

后端服务将在 `http://localhost:8080` 启动。

#### 3. 启动前端应用

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

访问 **http://localhost:5173** 使用应用。

### 📋 API 接口

#### 投票管理

| 方法 | 接口 | 描述 |
|------|------|------|
| GET | `/api/polls` | 获取所有投票 |
| GET | `/api/polls/:id` | 获取指定投票详情 |
| GET | `/api/polls/:id/results` | 获取投票结果 |
| GET | `/api/polls/:id/status` | 获取投票状态 |
| POST | `/api/polls` | 创建新投票 |
| POST | `/api/polls/:id/cancel` | 取消投票 |
| POST | `/api/polls/:id/activate` | 激活投票 |
| POST | `/api/polls/:id/deactivate` | 停用投票 |

#### 投票操作

| 方法 | 接口 | 描述 |
|------|------|------|
| POST | `/api/votes` | 投票 |
| GET | `/api/votes/:pollId/voter/:address` | 获取选民状态 |

#### 管理功能

| 方法 | 接口 | 描述 |
|------|------|------|
| GET | `/api/voting-power/:address` | 获取投票权 |
| POST | `/api/voting-power/assign` | 分配投票权 |
| POST | `/api/voting-power/assign-batch` | 批量分配投票权 |

### 🔧 智能合约功能

| 功能 | 描述 |
|------|------|
| **创建投票** | 自定义标题、描述、多个选项、开始/结束时间 |
| **投票权管理** | 管理员为每个地址分配投票权重 |
| **投票追踪** | 防止同一投票中重复投票 |
| **状态管理** | 活跃、非活跃、已取消、待开始、已结束 |
| **实时结果** | 实时显示票数和百分比 |

### 🛠️ 技术栈

| 层级 | 技术 |
|------|------|
| 智能合约 | Solidity 0.8.19, Hardhat |
| 后端 | Go 1.21, Gin, go-ethereum |
| 前端 | React 18, Vite, TailwindCSS, ethers.js |
| 网络 | Ethereum (本地/Sepolia/Goerli) |

### 📝 使用流程

1. **管理员** 通过管理面板为地址分配投票权
2. **创建者** 创建新投票，设置选项和时间范围
3. **投票者** 连接 MetaMask 钱包进行投票
4. **所有用户** 可在投票详情页查看实时结果

### 🔐 安全说明

- 仅合约管理员可以分配投票权
- 每个投票者在同一投票中只能投票一次
- 投票权必须大于 0 才能投票
- 投票必须处于活跃状态且在指定时间范围内

### 📜 许可证

MIT 许可证

---

## 📞 Support | 支持

If you encounter any issues, please check the following:
如遇到问题，请检查以下事项：

1. Ensure all dependencies are installed correctly
   确保所有依赖已正确安装

2. Verify the contract is deployed and address is configured
   确认合约已部署且地址已配置

3. Check MetaMask is connected to the correct network
   检查 MetaMask 已连接到正确的网络

4. Ensure your wallet has sufficient ETH for gas fees
   确保钱包有足够的 ETH 支付 gas 费用
