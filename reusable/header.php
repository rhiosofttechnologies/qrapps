<header>
  <div class="header-left">
    <img id="appLogo" src="">
    <h2 id="appTitle">QR Apps</h2>
  </div>
  <div class="header-icons">
    <i class="fas fa-cog" onclick="toggleDropdown()"></i>
    <i class="fas fa-moon" id="themeIcon" onclick="toggleTheme()"></i>
    <div class="dropdown" id="settingsDropdown">
      <button onclick="openAdd('module')"><i class="fas fa-plus"></i>Add Module</button>
      <button onclick="openThemeChooser()"><i class="fas fa-palette"></i>Theme Color</button>
      <button onclick="openAppearanceSettings()"><i class="fas fa-eye"></i>Appearance Settings</button>
      <button onclick="exportData()"><i class="fas fa-download"></i>Backup Data</button>
      <button onclick="importData()"><i class="fas fa-upload"></i>Restore Data</button>
    </div>
  </div>
</header>