export const getAdminPortalHtml = (apiBaseUrl: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>MadinatyAI Ecosystem — Souq Admin Portal</title>
  
  <!-- Modern Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  
  <!-- FontAwesome Icons -->
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  
  <!-- ChartJS -->
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>

  <style>
    :root {
      --bg-dark: #0b0f19;
      --bg-glass: rgba(17, 24, 39, 0.7);
      --border-glass: rgba(255, 255, 255, 0.08);
      --text-main: #f3f4f6;
      --text-muted: #9ca3af;
      --primary: #4f46e5;
      --primary-hover: #4338ca;
      --accent-cyan: #06b6d4;
      --accent-emerald: #10b981;
      --accent-rose: #f43f5e;
      --accent-amber: #f59e0b;
      --glow-color: rgba(79, 70, 229, 0.4);
      --font-outfit: 'Outfit', sans-serif;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      background-color: var(--bg-dark);
      color: var(--text-main);
      font-family: var(--font-outfit);
      min-height: 100vh;
      overflow-x: hidden;
      background-image: 
        radial-gradient(circle at 10% 20%, rgba(79, 70, 229, 0.15) 0%, transparent 40%),
        radial-gradient(circle at 90% 80%, rgba(6, 182, 212, 0.15) 0%, transparent 40%);
      background-attachment: fixed;
    }

    /* Scrollbars */
    ::-webkit-scrollbar {
      width: 8px;
    }
    ::-webkit-scrollbar-track {
      background: var(--bg-dark);
    }
    ::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
    }
    ::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }

    /* Auth Screen */
    #auth-screen {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      padding: 20px;
    }

    .auth-card {
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border: 1px solid var(--border-glass);
      border-radius: 24px;
      padding: 40px;
      width: 100%;
      max-width: 440px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.3);
      text-align: center;
    }

    .logo-container {
      margin-bottom: 30px;
    }

    .logo-icon {
      font-size: 3rem;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 10px;
    }

    .auth-title {
      font-size: 1.8rem;
      font-weight: 700;
      margin-bottom: 8px;
      letter-spacing: -0.5px;
    }

    .auth-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-bottom: 30px;
    }

    .form-group {
      margin-bottom: 20px;
      text-align: left;
    }

    .form-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .input-field {
      width: 100%;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-glass);
      border-radius: 12px;
      padding: 14px 16px;
      color: var(--text-main);
      font-family: var(--font-outfit);
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .input-field:focus {
      outline: none;
      border-color: var(--primary);
      box-shadow: 0 0 10px rgba(79, 70, 229, 0.3);
      background: rgba(255, 255, 255, 0.08);
    }

    .auth-btn {
      width: 100%;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      border: none;
      border-radius: 12px;
      padding: 14px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      font-family: var(--font-outfit);
      transition: all 0.3s ease;
      margin-top: 10px;
      box-shadow: 0 4px 15px rgba(79, 70, 229, 0.3);
    }

    .auth-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(79, 70, 229, 0.5);
    }

    .auth-btn:active {
      transform: translateY(0);
    }

    .error-msg {
      color: var(--accent-rose);
      font-size: 0.9rem;
      margin-top: 12px;
      display: none;
    }

    /* Main Dashboard Layout */
    #dashboard-layout {
      display: flex;
      min-height: 100vh;
    }

    /* Sidebar */
    .sidebar {
      width: 260px;
      background: var(--bg-glass);
      backdrop-filter: blur(20px);
      border-right: 1px solid var(--border-glass);
      padding: 30px 20px;
      display: flex;
      flex-direction: column;
      position: fixed;
      height: 100vh;
      z-index: 100;
    }

    .sidebar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 40px;
      padding-left: 8px;
    }

    .brand-icon {
      font-size: 1.8rem;
      color: var(--accent-cyan);
    }

    .brand-name {
      font-weight: 700;
      font-size: 1.25rem;
      letter-spacing: -0.5px;
    }

    .sidebar-menu {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 8px;
      flex-grow: 1;
    }

    .menu-item {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 12px 16px;
      border-radius: 12px;
      color: var(--text-muted);
      text-decoration: none;
      font-weight: 500;
      transition: all 0.3s ease;
      cursor: pointer;
    }

    .menu-item:hover, .menu-item.active {
      color: var(--text-main);
      background: rgba(255, 255, 255, 0.05);
    }

    .menu-item.active {
      background: rgba(79, 70, 229, 0.15);
      border: 1px solid rgba(79, 70, 229, 0.3);
      color: var(--text-main);
    }

    .menu-item i {
      font-size: 1.15rem;
      width: 20px;
      text-align: center;
    }

    .user-profile-section {
      border-top: 1px solid var(--border-glass);
      padding-top: 20px;
      margin-top: auto;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .user-avatar {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--primary), var(--accent-cyan));
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: bold;
    }

    .user-details {
      flex-grow: 1;
      overflow: hidden;
    }

    .user-role {
      font-size: 0.8rem;
      color: var(--accent-cyan);
      font-weight: 600;
    }

    .user-phone {
      font-size: 0.85rem;
      color: var(--text-muted);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .logout-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1.1rem;
      padding: 4px;
      transition: color 0.3s ease;
    }

    .logout-btn:hover {
      color: var(--accent-rose);
    }

    /* Main Content Area */
    .main-content {
      margin-left: 260px;
      flex-grow: 1;
      padding: 40px;
      max-width: 1400px;
    }

    .header-section {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
    }

    .header-title {
      font-size: 2rem;
      font-weight: 700;
      letter-spacing: -0.5px;
    }

    .header-subtitle {
      color: var(--text-muted);
      font-size: 0.95rem;
      margin-top: 4px;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .stat-card {
      background: var(--bg-glass);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-glass);
      border-radius: 18px;
      padding: 24px;
      display: flex;
      align-items: center;
      gap: 20px;
      transition: all 0.3s ease;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      border-color: rgba(255, 255, 255, 0.15);
    }

    .stat-icon {
      width: 52px;
      height: 52px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
    }

    .stat-icon.primary {
      background: rgba(79, 70, 229, 0.15);
      color: var(--primary);
    }
    .stat-icon.cyan {
      background: rgba(6, 182, 212, 0.15);
      color: var(--accent-cyan);
    }
    .stat-icon.emerald {
      background: rgba(16, 185, 129, 0.15);
      color: var(--accent-emerald);
    }
    .stat-icon.rose {
      background: rgba(244, 63, 94, 0.15);
      color: var(--accent-rose);
    }

    .stat-value {
      font-size: 1.8rem;
      font-weight: 700;
      line-height: 1.2;
    }

    .stat-label {
      color: var(--text-muted);
      font-size: 0.9rem;
      font-weight: 500;
    }

    /* Charts & Details Panel */
    .dashboard-panel-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin-bottom: 30px;
    }

    @media (max-width: 1024px) {
      .dashboard-panel-grid {
        grid-template-columns: 1fr;
      }
    }

    .panel {
      background: var(--bg-glass);
      backdrop-filter: blur(10px);
      border: 1px solid var(--border-glass);
      border-radius: 20px;
      padding: 24px;
    }

    .panel-title {
      font-size: 1.15rem;
      font-weight: 600;
      margin-bottom: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    /* Tables & Datagrids */
    .table-container {
      overflow-x: auto;
      margin-top: 15px;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th {
      padding: 14px 16px;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-muted);
      border-bottom: 1px solid var(--border-glass);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 16px;
      font-size: 0.95rem;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      color: var(--text-main);
    }

    tr:hover td {
      background: rgba(255, 255, 255, 0.02);
    }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 600;
      text-transform: uppercase;
    }

    .badge.active { background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); }
    .badge.sold { background: rgba(79, 70, 229, 0.15); color: #818cf8; }
    .badge.removed { background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); }
    .badge.reserved { background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); }
    .badge.pending { background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); }
    .badge.open { background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); }
    .badge.resolved { background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); }

    .trust-pill {
      font-weight: 700;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 0.85rem;
    }

    .trust-pill.high { background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); }
    .trust-pill.medium { background: rgba(245, 158, 11, 0.15); color: var(--accent-amber); }
    .trust-pill.low { background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); }

    /* Filters Section */
    .filter-bar {
      display: flex;
      gap: 15px;
      margin-bottom: 25px;
      flex-wrap: wrap;
    }

    .filter-select, .search-bar {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-glass);
      border-radius: 10px;
      padding: 10px 16px;
      color: var(--text-main);
      font-family: var(--font-outfit);
      font-size: 0.9rem;
    }

    .search-bar {
      flex-grow: 1;
      min-width: 200px;
    }

    .filter-select:focus, .search-bar:focus {
      outline: none;
      border-color: var(--primary);
    }

    /* Actions buttons */
    .action-btn {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid var(--border-glass);
      border-radius: 8px;
      color: var(--text-main);
      cursor: pointer;
      padding: 6px 12px;
      font-family: var(--font-outfit);
      font-size: 0.85rem;
      font-weight: 500;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }

    .action-btn:hover {
      background: var(--primary);
      border-color: var(--primary);
    }

    .action-btn.danger:hover {
      background: var(--accent-rose);
      border-color: var(--accent-rose);
    }

    /* Pagination */
    .pagination-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 25px;
    }

    .page-info {
      font-size: 0.9rem;
      color: var(--text-muted);
    }

    .page-btns {
      display: flex;
      gap: 8px;
    }

    /* Modals */
    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.6);
      backdrop-filter: blur(4px);
      z-index: 1000;
      display: none;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }

    .modal {
      background: var(--bg-glass);
      backdrop-filter: blur(25px);
      border: 1px solid var(--border-glass);
      border-radius: 24px;
      width: 100%;
      max-width: 500px;
      padding: 30px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.5);
    }

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .modal-title {
      font-size: 1.3rem;
      font-weight: 700;
    }

    .close-modal-btn {
      background: transparent;
      border: none;
      color: var(--text-muted);
      font-size: 1.25rem;
      cursor: pointer;
    }

    .modal-body {
      margin-bottom: 25px;
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    /* Switches */
    .switch-group {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 15px;
    }

    .switch-label {
      font-size: 0.95rem;
      font-weight: 500;
    }

    /* Dispute Summary Panel list */
    .dispute-item {
      padding: 12px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }
    .dispute-item:last-child {
      border: none;
    }
    .dispute-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .dispute-title {
      font-weight: 600;
      font-size: 0.95rem;
    }
    .dispute-date {
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .dispute-desc {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

  </style>
</head>
<body>

  <!-- 1. AUTH SCREEN -->
  <div id="auth-screen">
    <div class="auth-card">
      <div class="logo-container">
        <i class="fa-solid fa-circle-nodes logo-icon"></i>
        <h1 class="auth-title">Souq ElKanto</h1>
        <p class="auth-subtitle">Ecosystem Management & Admin Portal</p>
      </div>

      <!-- Phone Number Input Step -->
      <div id="step-phone">
        <div class="form-group">
          <label class="form-label">Admin Phone Number</label>
          <input type="text" id="phone-input" class="input-field" placeholder="e.g. +201000000000" value="+201000000000">
        </div>
        <button id="send-otp-btn" class="auth-btn">Send Authentication OTP</button>
      </div>

      <!-- OTP Code Input Step -->
      <div id="step-otp" style="display: none;">
        <div class="form-group">
          <label class="form-label">One-Time Password (OTP)</label>
          <input type="text" id="otp-input" class="input-field" placeholder="Enter 6-digit code" value="000000">
          <p style="font-size: 0.8rem; color: var(--accent-cyan); margin-top: 6px; text-align: left;">
            * In development mode, verify with 000000
          </p>
        </div>
        <button id="verify-otp-btn" class="auth-btn">Verify & Sign In</button>
      </div>

      <div id="auth-error" class="error-msg">Authentication failed.</div>
    </div>
  </div>

  <!-- 2. MAIN DASHBOARD LAYOUT -->
  <div id="dashboard-layout" style="display: none;">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-brand">
        <i class="fa-solid fa-shop brand-icon"></i>
        <div class="brand-name">Souq Admin</div>
      </div>

      <ul class="sidebar-menu">
        <li>
          <a class="menu-item active" data-tab="overview">
            <i class="fa-solid fa-chart-pie"></i>
            Overview
          </a>
        </li>
        <li>
          <a class="menu-item" data-tab="listings">
            <i class="fa-solid fa-tags"></i>
            Products / Listings
          </a>
        </li>
        <li>
          <a class="menu-item" data-tab="users">
            <i class="fa-solid fa-users"></i>
            Customers / Users
          </a>
        </li>
        <li>
          <a class="menu-item" data-tab="disputes">
            <i class="fa-solid fa-handshake-simple-slash"></i>
            Disputes
          </a>
        </li>
      </ul>

      <div class="user-profile-section">
        <div class="user-avatar" id="avatar-letters">AD</div>
        <div class="user-details">
          <div class="user-role">Platform Admin</div>
          <div class="user-phone" id="admin-display-phone">+20 1000000</div>
        </div>
        <button class="logout-btn" id="logout-btn" title="Sign Out">
          <i class="fa-solid fa-right-from-bracket"></i>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <main class="main-content">
      <div class="header-section">
        <div>
          <h2 class="header-title" id="page-title">Marketplace Overview</h2>
          <p class="header-subtitle" id="page-subtitle">Real-time statistics and hub insights</p>
        </div>
      </div>

      <!-- OVERVIEW TAB CONTENT -->
      <div id="tab-overview" class="tab-content">
        <!-- Stats Cards Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon primary">
              <i class="fa-solid fa-tags"></i>
            </div>
            <div>
              <div class="stat-value" id="stat-active-listings">0</div>
              <div class="stat-label">Active Listings</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon cyan">
              <i class="fa-solid fa-coins"></i>
            </div>
            <div>
              <div class="stat-value" id="stat-volume">0 EGP</div>
              <div class="stat-label">Transactions Volume</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon emerald">
              <i class="fa-solid fa-users"></i>
            </div>
            <div>
              <div class="stat-value" id="stat-active-users">0</div>
              <div class="stat-label">Active Customers</div>
            </div>
          </div>
          <div class="stat-card">
            <div class="stat-icon rose">
              <i class="fa-solid fa-circle-exclamation"></i>
            </div>
            <div>
              <div class="stat-value" id="stat-open-disputes">0</div>
              <div class="stat-label">Open Disputes</div>
            </div>
          </div>
        </div>

        <!-- Panels for charts -->
        <div class="dashboard-panel-grid">
          <div class="panel">
            <h3 class="panel-title">
              <i class="fa-solid fa-chart-column"></i>
              Category Distribution
            </h3>
            <div style="height: 300px; position: relative;">
              <canvas id="category-chart"></canvas>
            </div>
          </div>
          <div class="panel">
            <h3 class="panel-title">
              <i class="fa-solid fa-triangle-exclamation"></i>
              Disputes Status
            </h3>
            <div id="recent-disputes-list" style="max-height: 300px; overflow-y: auto;">
              <p style="color: var(--text-muted); font-size: 0.95rem;">Loading disputes summary...</p>
            </div>
          </div>
        </div>
      </div>

      <!-- LISTINGS TAB CONTENT -->
      <div id="tab-listings" class="tab-content" style="display: none;">
        <div class="panel">
          <div class="filter-bar">
            <input type="text" id="listing-search" class="search-bar" placeholder="Search by title...">
            <select id="listing-filter-status" class="filter-select">
              <option value="">All Statuses</option>
              <option value="ACTIVE" selected>Active</option>
              <option value="SOLD">Sold</option>
              <option value="RESERVED">Reserved</option>
              <option value="REMOVED">Removed</option>
            </select>
            <select id="listing-filter-category" class="filter-select">
              <option value="">All Categories</option>
            </select>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Asking Price</th>
                  <th>Seller</th>
                  <th>Seller Trust</th>
                  <th>Status</th>
                  <th>Created At</th>
                </tr>
              </thead>
              <tbody id="listings-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="listings-page-info">Showing 0 of 0 items</div>
            <div class="page-btns">
              <button class="action-btn" id="listings-prev-btn"><i class="fa-solid fa-chevron-left"></i> Previous</button>
              <button class="action-btn" id="listings-next-btn">Next <i class="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- USERS TAB CONTENT -->
      <div id="tab-users" class="tab-content" style="display: none;">
        <div class="panel">
          <div class="filter-bar">
            <input type="text" id="users-search" class="search-bar" placeholder="Search by phone number...">
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Phone Number</th>
                  <th>Trust Score</th>
                  <th>Role</th>
                  <th>Listings</th>
                  <th>Offers</th>
                  <th>Disputes</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody id="users-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="users-page-info">Showing 0 of 0 users</div>
            <div class="page-btns">
              <button class="action-btn" id="users-prev-btn"><i class="fa-solid fa-chevron-left"></i> Previous</button>
              <button class="action-btn" id="users-next-btn">Next <i class="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
        </div>
      </div>

      <!-- DISPUTES TAB CONTENT -->
      <div id="tab-disputes" class="tab-content" style="display: none;">
        <div class="panel">
          <div class="filter-bar">
            <select id="disputes-filter-status" class="filter-select">
              <option value="">All Disputes</option>
              <option value="OPEN" selected>Open</option>
              <option value="RESOLVED">Resolved</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Filer (Phone)</th>
                  <th>Accused (Phone)</th>
                  <th>Product Involved</th>
                  <th>Offer Value</th>
                  <th>Dispute Reason</th>
                  <th>Created At</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody id="disputes-table-body">
                <!-- Loaded Dynamically -->
              </tbody>
            </table>
          </div>

          <div class="pagination-bar">
            <div class="page-info" id="disputes-page-info">Showing 0 of 0 disputes</div>
            <div class="page-btns">
              <button class="action-btn" id="disputes-prev-btn"><i class="fa-solid fa-chevron-left"></i> Previous</button>
              <button class="action-btn" id="disputes-next-btn">Next <i class="fa-solid fa-chevron-right"></i></button>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>

  <!-- DISPUTE RESOLUTION MODAL -->
  <div id="resolve-modal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h4 class="modal-title">Resolve Dispute</h4>
        <button class="close-modal-btn" onclick="closeResolveModal()"><i class="fa-solid fa-xmark"></i></button>
      </div>
      <div class="modal-body">
        <input type="hidden" id="modal-dispute-id">
        <div class="form-group">
          <label class="form-label" for="resolution-text">Resolution Details</label>
          <textarea id="resolution-text" class="input-field" style="height: 100px; resize: none;" placeholder="Explain the resolution terms..."></textarea>
        </div>
        <div class="switch-group">
          <input type="checkbox" id="file-report-check" class="filter-select" style="width: auto; cursor: pointer;">
          <label class="switch-label" for="file-report-check">File platform-wide report (Penalize trust score)</label>
        </div>
      </div>
      <div class="modal-footer">
        <button class="action-btn" onclick="closeResolveModal()">Cancel</button>
        <button class="action-btn" style="background: var(--accent-emerald); border-color: var(--accent-emerald);" onclick="submitResolveDispute()">Confirm Resolution</button>
      </div>
    </div>
  </div>

  <script>
    const API_URL = '${apiBaseUrl}';
    let token = localStorage.getItem('admin_token') || '';
    let currentTab = 'overview';
    let statsChartInstance = null;

    // Pagination states
    let listingsPage = 1;
    let usersPage = 1;
    let disputesPage = 1;

    document.addEventListener('DOMContentLoaded', () => {
      initAuth();
      setupMenu();
      setupFilters();
    });

    // ────────────────────── AUTHENTICATION ──────────────────────

    function initAuth() {
      if (token) {
        verifyTokenAndLoad();
      } else {
        showAuthScreen();
      }

      document.getElementById('send-otp-btn').addEventListener('click', sendOtp);
      document.getElementById('verify-otp-btn').addEventListener('click', verifyOtp);
      document.getElementById('logout-btn').addEventListener('click', logout);
    }

    function showAuthScreen() {
      document.getElementById('auth-screen').style.display = 'flex';
      document.getElementById('dashboard-layout').style.display = 'none';
      document.getElementById('step-phone').style.display = 'block';
      document.getElementById('step-otp').style.display = 'none';
    }

    async function sendOtp() {
      const phone = document.getElementById('phone-input').value.trim();
      if (!phone) return;
      hideError();

      try {
        const res = await fetch(\`\${API_URL}/auth/login\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone })
        });
        const data = await res.json();
        
        if (res.ok) {
          document.getElementById('step-phone').style.display = 'none';
          document.getElementById('step-otp').style.display = 'block';
        } else {
          showError(data.message || 'Error requesting OTP.');
        }
      } catch (err) {
        showError('Network error connecting to API.');
      }
    }

    async function verifyOtp() {
      const phone = document.getElementById('phone-input').value.trim();
      const code = document.getElementById('otp-input').value.trim();
      if (!code) return;
      hideError();

      try {
        const res = await fetch(\`\${API_URL}/auth/verify-otp\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone, code })
        });
        const data = await res.json();
        
        if (res.ok) {
          token = data.data.token;
          localStorage.setItem('admin_token', token);
          verifyTokenAndLoad();
        } else {
          showError(data.message || 'Verification failed.');
        }
      } catch (err) {
        showError('Network error verifying OTP.');
      }
    }

    async function verifyTokenAndLoad() {
      try {
        const res = await fetch(\`\${API_URL}/auth/me\`, {
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
        const envelope = await res.json();
        const me = envelope.data;

        if (res.ok && (me.role === 'PLATFORM_ADMIN' || me.role === 'TENANT_ADMIN')) {
          document.getElementById('auth-screen').style.display = 'none';
          document.getElementById('dashboard-layout').style.display = 'flex';
          
          // Render Admin Display Info
          document.getElementById('admin-display-phone').textContent = me.phoneNumber;
          document.getElementById('avatar-letters').textContent = me.phoneNumber.slice(-2);
          
          loadTab(currentTab);
        } else {
          localStorage.removeItem('admin_token');
          token = '';
          showAuthScreen();
          showError('Access Denied: Only administrators are authorized.');
        }
      } catch (err) {
        localStorage.removeItem('admin_token');
        token = '';
        showAuthScreen();
        showError('Session expired. Please log in.');
      }
    }

    async function logout() {
      try {
        await fetch(\`\${API_URL}/auth/logout\`, {
          method: 'POST',
          headers: { 'Authorization': \`Bearer \${token}\` }
        });
      } catch {}
      localStorage.removeItem('admin_token');
      token = '';
      showAuthScreen();
    }

    function showError(msg) {
      const err = document.getElementById('auth-error');
      err.textContent = msg;
      err.style.display = 'block';
    }

    function hideError() {
      document.getElementById('auth-error').style.display = 'none';
    }

    // ────────────────────── NAVIGATION ──────────────────────

    function setupMenu() {
      document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
          document.querySelectorAll('.menu-item').forEach(m => m.classList.remove('active'));
          item.classList.add('active');
          const tab = item.getAttribute('data-tab');
          loadTab(tab);
        });
      });
    }

    function loadTab(tab) {
      currentTab = tab;
      
      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
      
      // Show requested tab
      document.getElementById(\`tab-\${tab}\`).style.display = 'block';

      // Update headers
      const title = document.getElementById('page-title');
      const subtitle = document.getElementById('page-subtitle');

      if (tab === 'overview') {
        title.textContent = 'Marketplace Overview';
        subtitle.textContent = 'Real-time statistics and hub insights';
        fetchOverviewStats();
      } else if (tab === 'listings') {
        title.textContent = 'Products & Listings';
        subtitle.textContent = 'Browse and filter P2P listings';
        fetchListings();
      } else if (tab === 'users') {
        title.textContent = 'Customers & Users';
        subtitle.textContent = 'Verify trust scores and platform user usage';
        fetchUsers();
      } else if (tab === 'disputes') {
        title.textContent = 'Transaction Disputes';
        subtitle.textContent = 'Resolve conflicts and review filed complaints';
        fetchDisputes();
      }
    }

    // ────────────────────── OVERVIEW STATS ──────────────────────

    async function fetchOverviewStats() {
      try {
        const res = await fetch(\`\${API_URL}/souq-admin/stats\`, {
          headers: { 
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          }
        });
        const envelope = await res.json();
        const stats = envelope.data;

        if (res.ok) {
          document.getElementById('stat-active-listings').textContent = stats.listings.ACTIVE;
          document.getElementById('stat-volume').textContent = \`\${stats.totalVolume.toLocaleString()} EGP\`;
          document.getElementById('stat-active-users').textContent = stats.activeUsersCount;
          document.getElementById('stat-open-disputes').textContent = stats.disputes.OPEN;

          renderCategoryChart(stats.categories);
          renderRecentDisputesSummary();
        }
      } catch (err) {
        console.error('Error loading stats:', err);
      }
    }

    function renderCategoryChart(data) {
      const ctx = document.getElementById('category-chart').getContext('2d');
      
      if (statsChartInstance) {
        statsChartInstance.destroy();
      }

      const labels = data.map(item => item.category);
      const counts = data.map(item => item.count);

      statsChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: labels,
          datasets: [{
            label: 'Listings',
            data: counts,
            backgroundColor: '#4f46e5',
            borderColor: '#06b6d4',
            borderWidth: 1,
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            x: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af' }
            },
            y: {
              grid: { color: 'rgba(255, 255, 255, 0.05)' },
              ticks: { color: '#9ca3af', stepSize: 1 }
            }
          }
        }
      });
    }

    async function renderRecentDisputesSummary() {
      const container = document.getElementById('recent-disputes-list');
      try {
        const res = await fetch(\`\${API_URL}/souq-admin/disputes?limit=5&status=OPEN\`, {
          headers: { 
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          }
        });
        const envelope = await res.json();
        const disputes = envelope.data.data;

        if (res.ok && disputes.length > 0) {
          container.innerHTML = disputes.map(d => \`
            <div class="dispute-item">
              <div class="dispute-header">
                <span class="dispute-title">\${d.reason}</span>
                <span class="dispute-date">\${new Date(d.createdAt).toLocaleDateString()}</span>
              </div>
              <p class="dispute-desc">Filer: \${d.filedBy?.phoneNumber || 'Unknown'} | Value: \${d.offer?.amount} EGP</p>
            </div>
          \`).join('');
        } else {
          container.innerHTML = '<p style="color: var(--text-muted); font-size: 0.95rem; text-align: center; margin-top: 40px;">No open disputes 🎉</p>';
        }
      } catch {
        container.innerHTML = '<p style="color: var(--accent-rose); font-size: 0.95rem;">Failed to load disputes.</p>';
      }
    }

    // ────────────────────── LISTINGS TAB ──────────────────────

    async function fetchListings() {
      const search = document.getElementById('listing-search').value;
      const status = document.getElementById('listing-filter-status').value;
      const category = document.getElementById('listing-filter-category').value;

      try {
        const res = await fetch(\`\${API_URL}/souq-admin/listings?page=\${listingsPage}&limit=10&status=\${status}&category=\${category}&q=\${search}\`, {
          headers: { 
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          }
        });
        const envelope = await res.json();
        const result = envelope.data;

        if (res.ok) {
          renderListingsTable(result.data);
          document.getElementById('listings-page-info').textContent = \`Page \${result.page} of \${result.totalPages || 1} (Total: \${result.total})\`;
          
          document.getElementById('listings-prev-btn').disabled = result.page <= 1;
          document.getElementById('listings-next-btn').disabled = result.page >= result.totalPages;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderListingsTable(listings) {
      const tbody = document.getElementById('listings-table-body');
      if (listings.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted);">No products found.</td></tr>';
        return;
      }

      tbody.innerHTML = listings.map(l => {
        let trustClass = 'high';
        const score = l.seller?.trustScore ?? 100;
        if (score < 40) trustClass = 'low';
        else if (score < 80) trustClass = 'medium';

        return \`
          <tr>
            <td>
              <div style="display: flex; align-items: center; gap: 12px;">
                \${l.photos[0] ? \`<img src="\${l.photos[0].url}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">\` : '<div style="width: 40px; height: 40px; border-radius: 6px; background: #1f2937; display: flex; align-items: center; justify-content: center;"><i class="fa-solid fa-image" style="color:#4b5563;"></i></div>'}
                <div>
                  <div style="font-weight: 600;">\${l.title}</div>
                  <div style="font-size: 0.8rem; color: var(--text-muted);">ID: \${l.id.slice(0, 8)}</div>
                </div>
              </div>
            </td>
            <td>\${l.category}</td>
            <td>\${l.askingPrice} \${l.currency}</td>
            <td>\${l.seller?.phoneNumber || 'Unknown'}</td>
            <td><span class="trust-pill \${trustClass}">\${score}</span></td>
            <td><span class="badge \${l.status.toLowerCase()}">\${l.status}</span></td>
            <td>\${new Date(l.createdAt).toLocaleDateString()}</td>
          </tr>
        \`;
      }).join('');
    }

    // ────────────────────── USERS TAB ──────────────────────

    async function fetchUsers() {
      const search = document.getElementById('users-search').value;

      try {
        const res = await fetch(\`\${API_URL}/souq-admin/users?page=\${usersPage}&limit=10&q=\${search}\`, {
          headers: { 
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          }
        });
        const envelope = await res.json();
        const result = envelope.data;

        if (res.ok) {
          renderUsersTable(result.data);
          document.getElementById('users-page-info').textContent = \`Page \${result.page} of \${result.totalPages || 1} (Total: \${result.total})\`;
          
          document.getElementById('users-prev-btn').disabled = result.page <= 1;
          document.getElementById('users-next-btn').disabled = result.page >= result.totalPages;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderUsersTable(users) {
      const tbody = document.getElementById('users-table-body');
      if (users.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No users found.</td></tr>';
        return;
      }

      tbody.innerHTML = users.map(u => {
        let trustClass = 'high';
        if (u.trustScore < 40) trustClass = 'low';
        else if (u.trustScore < 80) trustClass = 'medium';

        return \`
          <tr>
            <td style="font-family: monospace; font-size: 0.85rem; color: var(--text-muted);">\${u.id.slice(0, 8)}...</td>
            <td>\${u.phoneNumber}</td>
            <td><span class="trust-pill \${trustClass}">\${u.trustScore}</span></td>
            <td><span class="badge" style="background: rgba(255,255,255,0.05);">\${u.role}</span></td>
            <td>\${u.listingsCount}</td>
            <td>\${u.offersCount}</td>
            <td>\${u.disputesCount}</td>
            <td>\${new Date(u.createdAt).toLocaleDateString()}</td>
          </tr>
        \`;
      }).join('');
    }

    // ────────────────────── DISPUTES TAB ──────────────────────

    async function fetchDisputes() {
      const status = document.getElementById('disputes-filter-status').value;

      try {
        const res = await fetch(\`\${API_URL}/souq-admin/disputes?page=\${disputesPage}&limit=10&status=\${status}\`, {
          headers: { 
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          }
        });
        const envelope = await res.json();
        const result = envelope.data;

        if (res.ok) {
          renderDisputesTable(result.data);
          document.getElementById('disputes-page-info').textContent = \`Page \${result.page} of \${result.totalPages || 1} (Total: \${result.total})\`;
          
          document.getElementById('disputes-prev-btn').disabled = result.page <= 1;
          document.getElementById('disputes-next-btn').disabled = result.page >= result.totalPages;
        }
      } catch (err) {
        console.error(err);
      }
    }

    function renderDisputesTable(disputes) {
      const tbody = document.getElementById('disputes-table-body');
      if (disputes.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: var(--text-muted);">No disputes matching filter.</td></tr>';
        return;
      }

      tbody.innerHTML = disputes.map(d => \`
        <tr>
          <td>\${d.filedBy?.phoneNumber || 'Unknown'}</td>
          <td>\${d.against?.phoneNumber || 'Unknown'}</td>
          <td>\${d.offer?.listing?.title || 'Listing Removed'}</td>
          <td>\${d.offer?.amount} EGP</td>
          <td><span style="font-weight: 500;">\${d.reason}</span></td>
          <td>\${new Date(d.createdAt).toLocaleDateString()}</td>
          <td><span class="badge \${d.status.toLowerCase()}">\${d.status}</span></td>
          <td>
            \${d.status === 'OPEN' ? \`
              <button class="action-btn" style="background: rgba(16, 185, 129, 0.15); color: var(--accent-emerald); border-color: rgba(16, 185, 129, 0.3);" onclick="openResolveModal('\${d.id}')">
                <i class="fa-solid fa-check"></i> Resolve
              </button>
              <button class="action-btn danger" style="background: rgba(244, 63, 94, 0.15); color: var(--accent-rose); border-color: rgba(244, 63, 94, 0.3);" onclick="rejectDispute('\${d.id}')">
                <i class="fa-solid fa-xmark"></i> Reject
              </button>
            \` : \`<div style="font-size:0.85rem; color: var(--text-muted);">By: \${d.resolvedBy?.phoneNumber || 'System'}</div>\`}
          </td>
        </tr>
      \`).join('');
    }

    // Resolve dispute logic
    function openResolveModal(disputeId) {
      document.getElementById('modal-dispute-id').value = disputeId;
      document.getElementById('resolution-text').value = '';
      document.getElementById('file-report-check').checked = false;
      document.getElementById('resolve-modal').style.display = 'flex';
    }

    function closeResolveModal() {
      document.getElementById('resolve-modal').style.display = 'none';
    }

    async function submitResolveDispute() {
      const id = document.getElementById('modal-dispute-id').value;
      const resolution = document.getElementById('resolution-text').value.trim();
      const fileReport = document.getElementById('file-report-check').checked;

      if (!resolution) return alert('Please enter resolution details.');

      try {
        const res = await fetch(\`\${API_URL}/disputes/\${id}/resolve\`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          },
          body: JSON.stringify({ resolution, fileReport })
        });

        if (res.ok) {
          closeResolveModal();
          fetchDisputes();
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to resolve dispute.');
        }
      } catch (err) {
        alert('Network error resolving dispute.');
      }
    }

    async function rejectDispute(id) {
      const reason = prompt('Please enter the reason for rejecting this dispute:');
      if (reason === null) return; // cancelled
      if (!reason.trim()) return alert('Reason is required to reject a dispute.');

      try {
        const res = await fetch(\`\${API_URL}/disputes/\${id}/reject\`, {
          method: 'PATCH',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': \`Bearer \${token}\`,
            'x-tenant-id': 'kanto'
          },
          body: JSON.stringify({ reason })
        });

        if (res.ok) {
          fetchDisputes();
        } else {
          const data = await res.json();
          alert(data.message || 'Failed to reject dispute.');
        }
      } catch (err) {
        alert('Network error rejecting dispute.');
      }
    }

    // ────────────────────── UTILS & FILTER SETUP ──────────────────────

    function setupFilters() {
      // Listings
      document.getElementById('listing-search').addEventListener('input', debounce(() => {
        listingsPage = 1;
        fetchListings();
      }, 300));

      document.getElementById('listing-filter-status').addEventListener('change', () => {
        listingsPage = 1;
        fetchListings();
      });

      document.getElementById('listing-filter-category').addEventListener('change', () => {
        listingsPage = 1;
        fetchListings();
      });

      // Categories list populate
      const categories = [
        'FURNITURE', 'ELECTRONICS', 'APPLIANCES', 'FASHION', 
        'KIDS_TOYS', 'KIDS_CLOTHING', 'KIDS_GEAR', 'BOOKS_MEDIA', 
        'SPORTS_OUTDOOR', 'HOME_DECOR', 'KITCHEN_DINING', 'BABY_MATERNITY',
        'MOBILE_TABLETS', 'VINTAGE_COLLECTIBLES', 'MOVING_BUNDLE', 'OTHER'
      ];
      const catSelect = document.getElementById('listing-filter-category');
      categories.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c;
        opt.textContent = c;
        catSelect.appendChild(opt);
      });

      // Users
      document.getElementById('users-search').addEventListener('input', debounce(() => {
        usersPage = 1;
        fetchUsers();
      }, 300));

      // Disputes
      document.getElementById('disputes-filter-status').addEventListener('change', () => {
        disputesPage = 1;
        fetchDisputes();
      });

      // Pagination clicks
      document.getElementById('listings-prev-btn').addEventListener('click', () => {
        if (listingsPage > 1) { listingsPage--; fetchListings(); }
      });
      document.getElementById('listings-next-btn').addEventListener('click', () => {
        listingsPage++; fetchListings();
      });

      document.getElementById('users-prev-btn').addEventListener('click', () => {
        if (usersPage > 1) { usersPage--; fetchUsers(); }
      });
      document.getElementById('users-next-btn').addEventListener('click', () => {
        usersPage++; fetchUsers();
      });

      document.getElementById('disputes-prev-btn').addEventListener('click', () => {
        if (disputesPage > 1) { disputesPage--; fetchDisputes(); }
      });
      document.getElementById('disputes-next-btn').addEventListener('click', () => {
        disputesPage++; fetchDisputes();
      });
    }

    function debounce(func, wait) {
      let timeout;
      return function(...args) {
        clearTimeout(timeout);
        timeout = setTimeout(() => func.apply(this, args), wait);
      };
    }
  </script>
</body>
</html>
`;
