# SQL Database Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         FEUERWEHR PANEL APP                              │
│                                                                           │
│  ┌──────────────┐     ┌──────────────┐      ┌──────────────┐           │
│  │   iPad #1    │     │   iPad #2    │      │  Computer    │           │
│  │  (Safari)    │     │  (Safari)    │      │  (Browser)   │           │
│  └───────┬──────┘     └───────┬──────┘      └───────┬──────┘           │
│          │                    │                      │                   │
│          └────────────────────┼──────────────────────┘                   │
│                               │                                          │
└───────────────────────────────┼──────────────────────────────────────────┘
                                │
                                │ HTTP/HTTPS
                                │ REST API
                                │
┌───────────────────────────────▼──────────────────────────────────────────┐
│                        BACKEND SERVER                                     │
│                                                                           │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      Express.js API Server                         │  │
│  │                                                                    │  │
│  │  Endpoints:                                                        │  │
│  │  • GET  /api/health                                               │  │
│  │  • GET  /api/moveables/:pageFile                                  │  │
│  │  • POST /api/moveables/:pageFile                                  │  │
│  │  • GET  /api/button-texts                                         │  │
│  │  • POST /api/button-text                                          │  │
│  │  • GET  /api/custom-buttons                                       │  │
│  │  • POST /api/migrate/import                                       │  │
│  │  • GET  /api/export                                               │  │
│  └────────────────────────────┬───────────────────────────────────────┘  │
│                               │                                          │
│                               │ SQL Queries                              │
│                               │                                          │
│  ┌────────────────────────────▼───────────────────────────────────────┐  │
│  │                    SQLite Database                                 │  │
│  │                   (feuerwehr.db)                                   │  │
│  │                                                                    │  │
│  │  Tables:                                                           │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐             │  │
│  │  │   pages     │  │  moveables  │  │custom_buttons│             │  │
│  │  ├─────────────┤  ├─────────────┤  ├──────────────┤             │  │
│  │  │ id          │  │ id          │  │ id           │             │  │
│  │  │ file_name   │  │ page_file   │  │ button_type  │             │  │
│  │  │ title       │  │ label       │  │ label        │             │  │
│  │  │ created_at  │  │ area_id     │  │ display_text │             │  │
│  │  │ updated_at  │  │ timestamp   │  │ created_at   │             │  │
│  │  └─────────────┘  └─────────────┘  └──────────────┘             │  │
│  │                                                                    │  │
│  │  ┌──────────────┐  ┌──────────────┐                              │  │
│  │  │ button_texts │  │removed_items │                              │  │
│  │  ├──────────────┤  ├──────────────┤                              │  │
│  │  │ label        │  │ id           │                              │  │
│  │  │ custom_text  │  │ item_type    │                              │  │
│  │  │ created_at   │  │ list_category│                              │  │
│  │  │ updated_at   │  │ item_label   │                              │  │
│  │  └──────────────┘  │ removed_at   │                              │  │
│  │                    └──────────────┘                              │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                           │
└───────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### Before (localStorage)
```
┌──────────┐
│  iPad    │
│          │
│ ┌──────┐ │    Data stored locally
│ │Local │ │    No sharing between devices
│ │Storage│ │    ~5MB limit
│ └──────┘ │
└──────────┘
```

### After (SQL Database)
```
┌──────────┐     ┌──────────┐     ┌──────────┐
│  iPad #1 │────┐│  iPad #2 │────┐│  iPad #3 │
└──────────┘    ││          │    ││          │
                └┴──────────┘    └┴──────────┘
                 │                 │
                 │  REST API       │
                 └────────┬────────┘
                          │
                    ┌─────▼─────┐
                    │  Server   │
                    │           │
                    │ ┌───────┐ │
                    │ │  SQL  │ │  Central database
                    │ │  DB   │ │  Shared data
                    │ └───────┘ │  Unlimited size
                    └───────────┘
```

## Migration Flow

```
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Export from localStorage                           │
│                                                              │
│  Browser Console:                                            │
│  > exportLocalStorageData()                                 │
│                                                              │
│  Result: JSON file downloaded                               │
│  ┌──────────────────────────────────────┐                  │
│  │ {                                    │                  │
│  │   "moveables": {...},                │                  │
│  │   "customButtons": [...],            │                  │
│  │   "buttonTexts": {...},              │                  │
│  │   "removedItems": {...}              │                  │
│  │ }                                    │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Upload to SQL Server                               │
│                                                              │
│  Browser Console:                                            │
│  > uploadToServer('http://localhost:3000/api')              │
│                                                              │
│  POST /api/migrate/import                                   │
│  ┌──────────────────────────────────────┐                  │
│  │ Server parses JSON and inserts       │                  │
│  │ into database tables:                │                  │
│  │ • moveables table                    │                  │
│  │ • custom_buttons table               │                  │
│  │ • button_texts table                 │                  │
│  │ • removed_items table                │                  │
│  └──────────────────────────────────────┘                  │
└─────────────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Verify Migration                                   │
│                                                              │
│  • Test data retrieval                                       │
│  • Compare with localStorage export                          │
│  • Verify all records migrated                              │
│  • Test CRUD operations                                      │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Options Comparison

```
┌──────────────────┬─────────────┬─────────────┬───────────────┐
│    Option        │   Effort    │    Cost     │   Use Case    │
├──────────────────┼─────────────┼─────────────┼───────────────┤
│ Raspberry Pi     │    Low      │   $35-50    │ Small team    │
│ (Local)          │             │   (one-time)│ Local network │
├──────────────────┼─────────────┼─────────────┼───────────────┤
│ Railway          │  Very Low   │   $5-20/mo  │ Small/Medium  │
│ (Cloud)          │             │             │ Public access │
├──────────────────┼─────────────┼─────────────┼───────────────┤
│ Render           │  Very Low   │   Free/$7+  │ Small team    │
│ (Cloud)          │             │             │ Public access │
├──────────────────┼─────────────┼─────────────┼───────────────┤
│ VPS (DigitalOcean│   Medium    │   $5-10/mo  │ Medium team   │
│ Linode, etc)     │             │             │ Full control  │
├──────────────────┼─────────────┼─────────────┼───────────────┤
│ Docker Container │   Medium    │  Varies     │ Any size      │
│ (Self-hosted)    │             │             │ Portable      │
└──────────────────┴─────────────┴─────────────┴───────────────┘
```

## Performance Comparison

```
┌──────────────────┬────────────────┬────────────────┐
│   Operation      │  localStorage  │   SQL Database │
├──────────────────┼────────────────┼────────────────┤
│ Read (single)    │    < 1ms       │    2-5ms       │
├──────────────────┼────────────────┼────────────────┤
│ Write (single)   │    < 1ms       │    3-8ms       │
├──────────────────┼────────────────┼────────────────┤
│ Read (all data)  │    1-10ms      │    10-50ms     │
├──────────────────┼────────────────┼────────────────┤
│ Complex query    │    N/A         │    5-20ms      │
├──────────────────┼────────────────┼────────────────┤
│ Concurrent users │    1           │    10-100+     │
├──────────────────┼────────────────┼────────────────┤
│ Storage limit    │    5-10 MB     │    Unlimited   │
├──────────────────┼────────────────┼────────────────┤
│ Data integrity   │    None        │    ACID        │
└──────────────────┴────────────────┴────────────────┘
```

## Feature Comparison

```
✅ = Supported | ❌ = Not Supported | ⚠️ = Limited

┌──────────────────────┬──────────────┬──────────────┐
│     Feature          │ localStorage │ SQL Database │
├──────────────────────┼──────────────┼──────────────┤
│ Offline access       │      ✅      │      ⚠️      │
│ Multi-device sync    │      ❌      │      ✅      │
│ Concurrent users     │      ❌      │      ✅      │
│ Data backup          │      ⚠️      │      ✅      │
│ Complex queries      │      ❌      │      ✅      │
│ Relationships        │      ❌      │      ✅      │
│ Transaction support  │      ❌      │      ✅      │
│ Zero setup           │      ✅      │      ❌      │
│ No server needed     │      ✅      │      ❌      │
│ Works everywhere     │      ✅      │      ⚠️      │
│ Scalability          │      ❌      │      ✅      │
│ Data migration       │      ⚠️      │      ✅      │
└──────────────────────┴──────────────┴──────────────┘
```
