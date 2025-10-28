# 集成架构文档

> **生成时间**: 2025-01-XX XX:XX:XX  
> **系统**: DailyUse 跨应用集成架构  
> **范围**: API ↔ Web ↔ Desktop + 共享包  
> **通信方式**: REST API + SSE + IPC

---

## 📋 概览

### 执行摘要

DailyUse 采用多应用集成架构，由 **API Backend**、**Web Application** 和 **Desktop Application** 三个独立应用组成，通过 **REST API**、**Server-Sent Events (SSE)** 和 **Electron IPC** 进行通信。5 个共享包提供跨应用的代码复用。

### 集成架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                     │
├──────────────────────────────┬──────────────────────────────┤
│   Web Application (Vue 3)    │   Desktop App (Electron)     │
│   - Browser-based            │   - Native Windows/Mac/Linux │
│   - Port: 5173 (dev)         │   - SQLite local database    │
│   - Pinia state mgmt         │   - IPC communication        │
└──────────────┬───────────────┴────────────────┬─────────────┘
               │                                │
        ┌──────▼────────┐               ┌──────▼────────┐
        │  REST API     │               │  REST API     │
        │  (Axios)      │               │  (Axios)      │
        └──────┬────────┘               └──────┬────────┘
               │                                │
        ┌──────▼────────┐               ┌──────▼────────┐
        │  SSE Client   │               │  SSE Client   │
        │ (EventSource) │               │  (optional)   │
        └──────┬────────┘               └──────┬────────┘
               │                                │
               └────────────┬───────────────────┘
                            │
                   ┌────────▼────────┐
                   │  API Backend    │
                   │  (Express.js)   │
                   │  Port: 3888     │
                   └────────┬────────┘
                            │
                   ┌────────▼────────┐
                   │  PostgreSQL DB  │
                   │  Port: 5432     │
                   └─────────────────┘
```

### 共享包

- **@dailyuse/contracts**: DTOs + 类型定义
- **@dailyuse/domain-client**: 客户端领域逻辑
- **@dailyuse/domain-server**: 服务端领域逻辑  
- **@dailyuse/ui**: 共享 Vue 组件
- **@dailyuse/utils**: 工具函数库

---

## 📚 相关文档

- [项目概览](./project-overview.md)
- [API Backend 架构](./architecture-api.md)
- [Web Application 架构](./architecture-web.md)

---

**文档维护**: BMAD v6 Analyst  
**最后更新**: 2025-01-XX
