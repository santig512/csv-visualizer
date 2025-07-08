<script setup lang="ts">
// Aquí irá la lógica global más adelante
</script>

<template>
  <div id="app">
    <nav class="navbar">
      <div class="nav-brand">
        <h2>CSV Visualizer</h2>
      </div>
      <div class="nav-links">
        <router-link to="/charts" class="nav-link">Gráficos</router-link>
        <router-link to="/table" class="nav-link">Tabla</router-link>
      </div>
    </nav>
    
    <main class="main-content">
      <router-view />
    </main>
  </div>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 2rem;
  background-color: #2c3e50;
  color: white;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
  z-index: 1000;
}

.nav-brand h2 {
  margin: 0;
  color: white;
}

.nav-links {
  display: flex;
  gap: 1rem;
}

.nav-link {
  color: white;
  text-decoration: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  transition: background-color 0.3s;
}

.nav-link:hover,
.nav-link.router-link-active {
  background-color: #34495e;
}

.main-content {
  margin-top: 80px;
  padding: 2rem;
  min-height: calc(100vh - 80px);
}

#app {
  min-height: 100vh;
  margin: 0;
  padding: 0;
}
</style>
