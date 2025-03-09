// vite.config.js
import { defineConfig } from "file:///mnt/c/Users/user/SomeGoodFiles/CS2-2/classPDF/SW%20project/CW/CW2/software-engineering-project-team-41/frontend/node_modules/vite/dist/node/index.js";
import dotenv from "file:///mnt/c/Users/user/SomeGoodFiles/CS2-2/classPDF/SW%20project/CW/CW2/software-engineering-project-team-41/frontend/node_modules/dotenv/lib/main.js";
import react from "file:///mnt/c/Users/user/SomeGoodFiles/CS2-2/classPDF/SW%20project/CW/CW2/software-engineering-project-team-41/frontend/node_modules/@vitejs/plugin-react/dist/index.mjs";
import tailwindcss from "file:///mnt/c/Users/user/SomeGoodFiles/CS2-2/classPDF/SW%20project/CW/CW2/software-engineering-project-team-41/frontend/node_modules/@tailwindcss/vite/dist/index.mjs";
dotenv.config({ path: "../.env" });
var vite_config_default = defineConfig({
  define: {
    "process.env": process.env
  },
  plugins: [
    react(),
    tailwindcss()
  ],
  server: {
    proxy: {
      "/api": {
        target: process.env.VITE_API_URL || "http://localhost:5000",
        changeOrigin: true
      }
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcuanMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvbW50L2MvVXNlcnMvdXNlci9Tb21lR29vZEZpbGVzL0NTMi0yL2NsYXNzUERGL1NXIHByb2plY3QvQ1cvQ1cyL3NvZnR3YXJlLWVuZ2luZWVyaW5nLXByb2plY3QtdGVhbS00MS9mcm9udGVuZFwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL21udC9jL1VzZXJzL3VzZXIvU29tZUdvb2RGaWxlcy9DUzItMi9jbGFzc1BERi9TVyBwcm9qZWN0L0NXL0NXMi9zb2Z0d2FyZS1lbmdpbmVlcmluZy1wcm9qZWN0LXRlYW0tNDEvZnJvbnRlbmQvdml0ZS5jb25maWcuanNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL21udC9jL1VzZXJzL3VzZXIvU29tZUdvb2RGaWxlcy9DUzItMi9jbGFzc1BERi9TVyUyMHByb2plY3QvQ1cvQ1cyL3NvZnR3YXJlLWVuZ2luZWVyaW5nLXByb2plY3QtdGVhbS00MS9mcm9udGVuZC92aXRlLmNvbmZpZy5qc1wiO2ltcG9ydCB7IGRlZmluZUNvbmZpZyB9IGZyb20gJ3ZpdGUnXG5pbXBvcnQgZG90ZW52IGZyb20gJ2RvdGVudic7XG5pbXBvcnQgcmVhY3QgZnJvbSAnQHZpdGVqcy9wbHVnaW4tcmVhY3QnXG5pbXBvcnQgdGFpbHdpbmRjc3MgZnJvbSAnQHRhaWx3aW5kY3NzL3ZpdGUnXG5cbi8vIExvYWQgdGhlIHJvb3QgLmVudiBmaWxlXG5kb3RlbnYuY29uZmlnKHsgcGF0aDogJy4uLy5lbnYnIH0pO1xuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBkZWZpbmU6IHtcbiAgICAncHJvY2Vzcy5lbnYnOiBwcm9jZXNzLmVudlxuICB9LFxuICBwbHVnaW5zOiBbXG4gICAgcmVhY3QoKSxcbiAgICB0YWlsd2luZGNzcygpLFxuICBdLFxuICBzZXJ2ZXI6IHtcbiAgICBwcm94eToge1xuICAgICAgJy9hcGknOiB7XG4gICAgICAgIHRhcmdldDogcHJvY2Vzcy5lbnYuVklURV9BUElfVVJMIHx8IFwiaHR0cDovL2xvY2FsaG9zdDo1MDAwXCIsXG4gICAgICAgIGNoYW5nZU9yaWdpbjogdHJ1ZSxcbiAgICAgIH1cbiAgICB9XG4gIH1cbn0pO1xuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE4ZixTQUFTLG9CQUFvQjtBQUMzaEIsT0FBTyxZQUFZO0FBQ25CLE9BQU8sV0FBVztBQUNsQixPQUFPLGlCQUFpQjtBQUd4QixPQUFPLE9BQU8sRUFBRSxNQUFNLFVBQVUsQ0FBQztBQUVqQyxJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixRQUFRO0FBQUEsSUFDTixlQUFlLFFBQVE7QUFBQSxFQUN6QjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sWUFBWTtBQUFBLEVBQ2Q7QUFBQSxFQUNBLFFBQVE7QUFBQSxJQUNOLE9BQU87QUFBQSxNQUNMLFFBQVE7QUFBQSxRQUNOLFFBQVEsUUFBUSxJQUFJLGdCQUFnQjtBQUFBLFFBQ3BDLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K
