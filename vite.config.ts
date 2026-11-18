import { defineConfig } from 'vite';
export default defineConfig({ base:'/azure-icons/', server:{watch:{ignored:['**/.impeccable/**','**/verification/**','**/docs/**']}}, build:{ outDir:'docs', emptyOutDir:true, rollupOptions:{input:{icons:'index.html',architectures:'architectures/index.html'}} } });
