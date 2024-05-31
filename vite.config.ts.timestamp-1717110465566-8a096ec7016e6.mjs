// vite.config.ts
import react from "file:///C:/Users/gavin/OneDrive/Documents/Projects/pyrodev/panel/node_modules/@vitejs/plugin-react-swc/index.mjs";
import * as child from "child_process";
import laravel from "file:///C:/Users/gavin/OneDrive/Documents/Projects/pyrodev/panel/node_modules/laravel-vite-plugin/dist/index.js";
import million from "file:///C:/Users/gavin/OneDrive/Documents/Projects/pyrodev/panel/node_modules/million/dist/packages/compiler.mjs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "file:///C:/Users/gavin/OneDrive/Documents/Projects/pyrodev/panel/node_modules/pathe/dist/index.mjs";
import { defineConfig } from "file:///C:/Users/gavin/OneDrive/Documents/Projects/pyrodev/panel/node_modules/vite/dist/node/index.js";
import manifestSRI from "file:///C:/Users/gavin/OneDrive/Documents/Projects/pyrodev/panel/node_modules/vite-plugin-manifest-sri/dist/index.js";

// package.json
var package_default = {
  name: "pyrodactyl",
  version: "1.7.0",
  buildNumber: "170000",
  engines: {
    node: ">=20.0"
  },
  type: "module",
  dependencies: {
    "@codemirror/autocomplete": "^6.16.0",
    "@codemirror/commands": "^6.3.3",
    "@codemirror/language-data": "^6.5.0",
    "@codemirror/legacy-modes": "^6.4.0",
    "@codemirror/lint": "^6.5.0",
    "@codemirror/search": "^6.5.6",
    "@codemirror/state": "^6.4.1",
    "@codemirror/view": "^6.26.3",
    "@headlessui/react": "^1.7.18",
    "@preact/signals-react": "^2.0.1",
    "@radix-ui/react-checkbox": "^1.0.4",
    "@radix-ui/react-context-menu": "^2.1.5",
    "@radix-ui/react-dropdown-menu": "^2.0.6",
    "@radix-ui/react-icons": "^1.3.0",
    "@radix-ui/react-switch": "^1.0.3",
    "@radix-ui/react-tabs": "^1.0.4",
    "@sentry/react": "^7.110.0",
    "@sentry/vite-plugin": "^2.16.1",
    "@tanstack/react-virtual": "^3.2.1",
    "@xterm/addon-fit": "^0.10.0",
    "@xterm/addon-search": "^0.15.0",
    "@xterm/addon-web-links": "^0.11.0",
    "@xterm/xterm": "^5.5.0",
    axios: "^1.6.8",
    browserslist: "^4.23.0",
    "chart.js": "^4.4.2",
    clsx: "^2.1.0",
    cmdk: "^1.0.0",
    "copy-to-clipboard": "^3.3.3",
    "date-fns": "^3.6.0",
    debounce: "^2.0.0",
    "deepmerge-ts": "^5.1.0",
    "easy-peasy": "^6.0.4",
    events: "^3.3.0",
    formik: "^2.4.5",
    "framer-motion": "^11.0.28",
    "laravel-vite-plugin": "^1.0.2",
    million: "^3.0.6",
    pathe: "^1.1.2",
    "qrcode.react": "^3.1.0",
    react: "^18.3.0",
    "react-chartjs-2": "^5.2.0",
    "react-dom": "^18.3.0",
    "react-fast-compare": "^3.2.2",
    "react-router-dom": "^6.22.3",
    reaptcha: "^1.12.1",
    sockette: "^2.0.6",
    sonner: "^1.4.41",
    "styled-components": "^6.1.8",
    swr: "^2.2.5",
    "tailwind-merge": "^2.2.2",
    tailwindcss: "^3.4.3",
    "tailwindcss-animate": "^1.0.7",
    uuid: "^9.0.1",
    vite: "^5.2.8",
    yup: "^1.4.0"
  },
  devDependencies: {
    "@swc/plugin-styled-components": "^1.5.122",
    "@trivago/prettier-plugin-sort-imports": "^4.3.0",
    "@types/codemirror": "^5.60.15",
    "@types/debounce": "^1.2.4",
    "@types/events": "^3.0.3",
    "@types/node": "^20.12.7",
    "@types/qrcode.react": "^1.0.5",
    "@types/react": "^18.3.0",
    "@types/react-copy-to-clipboard": "^5.0.7",
    "@types/react-dom": "^18.3.0",
    "@types/react-redux": "^7.1.33",
    "@types/uuid": "^9.0.8",
    "@typescript-eslint/eslint-plugin": "^7.5.0",
    "@typescript-eslint/parser": "^7.5.0",
    "@vitejs/plugin-react-swc": "^3.6.0",
    autoprefixer: "^10.4.19",
    eslint: "^8.57.0",
    "eslint-config-prettier": "^9.1.0",
    "eslint-plugin-node": "^11.1.0",
    "eslint-plugin-prettier": "^5.1.3",
    "eslint-plugin-react": "^7.34.1",
    "eslint-plugin-react-hooks": "^4.6.0",
    postcss: "^8.4.38",
    "postcss-import": "^16.1.0",
    "postcss-nesting": "^12.1.1",
    "postcss-preset-env": "^9.5.5",
    prettier: "^3.2.5",
    "prettier-plugin-tailwindcss": "^0.5.13",
    "tailwindcss-inner-border": "^0.2.0",
    "ts-essentials": "^9.4.2",
    typescript: "^5.4.5",
    "vite-plugin-manifest-sri": "^0.2.0"
  },
  scripts: {
    lint: "eslint ./resources/scripts/**/*.{ts,tsx} --ext .ts,.tsx --fix",
    "lint:turbo": "turbo lint",
    dev: "vite",
    build: "vite build",
    "build:turbo": "turbo build",
    ship: "turbo lint build"
  },
  browserslist: [
    "> 0.5%",
    "last 2 versions",
    "firefox esr",
    "not dead"
  ]
};

// vite.config.ts
var __vite_injected_original_import_meta_url = "file:///C:/Users/gavin/OneDrive/Documents/Projects/pyrodev/panel/vite.config.ts";
var branchName;
var commitHash;
try {
  branchName = child.execSync("git rev-parse --abbrev-ref HEAD").toString().trimEnd();
  commitHash = child.execSync("git rev-parse HEAD").toString().trimEnd();
} catch (error) {
  console.error("Error executing git command:", error);
  branchName = "unknown";
  commitHash = "unknown";
}
var vite_config_default = defineConfig({
  build: {
    assetsInlineLimit: 0,
    emptyOutDir: true,
    // default manifest location is in .vite/manifest.json
    // laravel looks in public/build/manifest.json
    manifest: "manifest.json",
    outDir: "public/build",
    rollupOptions: {
      input: "resources/scripts/index.tsx",
      output: {
        // @ts-ignore
        manualChunks(id) {
          if (id.includes("node_modules")) {
            return id.toString().split("node_modules/")[1].split("/")[0].toString();
          }
        }
      }
    }
  },
  define: {
    "import.meta.env.VITE_PYRODACTYL_VERSION": JSON.stringify(package_default.version),
    "import.meta.env.VITE_COMMIT_HASH": JSON.stringify(commitHash),
    "import.meta.env.VITE_BRANCH_NAME": JSON.stringify(branchName),
    "import.meta.env.VITE_PYRODACTYL_BUILD_NUMBER": JSON.stringify(package_default.buildNumber),
    "process.env": {},
    "process.platform": null,
    "process.version": null,
    "process.versions": null
  },
  plugins: [
    laravel("resources/scripts/index.tsx"),
    manifestSRI(),
    [
      million.vite({
        auto: {
          threshold: 0.01
        },
        telemetry: false
      }),
      react({
        plugins: [
          [
            "@swc/plugin-styled-components",
            {
              pure: true,
              namespace: "pyrodactyl"
            }
          ]
        ]
      })
    ]
  ],
  resolve: {
    alias: {
      "@": resolve(dirname(fileURLToPath(__vite_injected_original_import_meta_url)), "resources", "scripts"),
      "@definitions": resolve(
        dirname(fileURLToPath(__vite_injected_original_import_meta_url)),
        "resources",
        "scripts",
        "api",
        "definitions"
      ),
      "@feature": resolve(
        dirname(fileURLToPath(__vite_injected_original_import_meta_url)),
        "resources",
        "scripts",
        "components",
        "server",
        "features"
      )
    }
  },
  server: {
    warmup: {
      clientFiles: [
        "resources/scripts/index.tsx",
        "resources/scripts/routers/DashboardRouter.tsx",
        "resources/scripts/components/dashboard/DashboardContainer.tsx",
        "resources/scripts/routers/ServerRouter.tsx"
      ]
    }
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiLCAicGFja2FnZS5qc29uIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcZ2F2aW5cXFxcT25lRHJpdmVcXFxcRG9jdW1lbnRzXFxcXFByb2plY3RzXFxcXHB5cm9kZXZcXFxccGFuZWxcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXGdhdmluXFxcXE9uZURyaXZlXFxcXERvY3VtZW50c1xcXFxQcm9qZWN0c1xcXFxweXJvZGV2XFxcXHBhbmVsXFxcXHZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9DOi9Vc2Vycy9nYXZpbi9PbmVEcml2ZS9Eb2N1bWVudHMvUHJvamVjdHMvcHlyb2Rldi9wYW5lbC92aXRlLmNvbmZpZy50c1wiO2ltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2MnO1xuaW1wb3J0ICogYXMgY2hpbGQgZnJvbSAnY2hpbGRfcHJvY2Vzcyc7XG5pbXBvcnQgbGFyYXZlbCBmcm9tICdsYXJhdmVsLXZpdGUtcGx1Z2luJztcbmltcG9ydCBtaWxsaW9uIGZyb20gJ21pbGxpb24vY29tcGlsZXInO1xuaW1wb3J0IHsgZmlsZVVSTFRvUGF0aCB9IGZyb20gJ25vZGU6dXJsJztcbmltcG9ydCB7IGRpcm5hbWUsIHJlc29sdmUgfSBmcm9tICdwYXRoZSc7XG5pbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCBtYW5pZmVzdFNSSSBmcm9tICd2aXRlLXBsdWdpbi1tYW5pZmVzdC1zcmknO1xuXG5pbXBvcnQgcGFja2FnZUpzb24gZnJvbSAnLi9wYWNrYWdlLmpzb24nO1xuXG5sZXQgYnJhbmNoTmFtZTtcbmxldCBjb21taXRIYXNoO1xuXG50cnkge1xuICAgIGJyYW5jaE5hbWUgPSBjaGlsZC5leGVjU3luYygnZ2l0IHJldi1wYXJzZSAtLWFiYnJldi1yZWYgSEVBRCcpLnRvU3RyaW5nKCkudHJpbUVuZCgpO1xuICAgIGNvbW1pdEhhc2ggPSBjaGlsZC5leGVjU3luYygnZ2l0IHJldi1wYXJzZSBIRUFEJykudG9TdHJpbmcoKS50cmltRW5kKCk7XG59IGNhdGNoIChlcnJvcikge1xuICAgIGNvbnNvbGUuZXJyb3IoJ0Vycm9yIGV4ZWN1dGluZyBnaXQgY29tbWFuZDonLCBlcnJvcik7XG4gICAgYnJhbmNoTmFtZSA9ICd1bmtub3duJztcbiAgICBjb21taXRIYXNoID0gJ3Vua25vd24nO1xufVxuXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICAgIGJ1aWxkOiB7XG4gICAgICAgIGFzc2V0c0lubGluZUxpbWl0OiAwLFxuICAgICAgICBlbXB0eU91dERpcjogdHJ1ZSxcblxuICAgICAgICAvLyBkZWZhdWx0IG1hbmlmZXN0IGxvY2F0aW9uIGlzIGluIC52aXRlL21hbmlmZXN0Lmpzb25cbiAgICAgICAgLy8gbGFyYXZlbCBsb29rcyBpbiBwdWJsaWMvYnVpbGQvbWFuaWZlc3QuanNvblxuICAgICAgICBtYW5pZmVzdDogJ21hbmlmZXN0Lmpzb24nLFxuXG4gICAgICAgIG91dERpcjogJ3B1YmxpYy9idWlsZCcsXG5cbiAgICAgICAgcm9sbHVwT3B0aW9uczoge1xuICAgICAgICAgICAgaW5wdXQ6ICdyZXNvdXJjZXMvc2NyaXB0cy9pbmRleC50c3gnLFxuICAgICAgICAgICAgb3V0cHV0OiB7XG4gICAgICAgICAgICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgICAgICAgICAgIG1hbnVhbENodW5rcyhpZCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoaWQuaW5jbHVkZXMoJ25vZGVfbW9kdWxlcycpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBAdHMtZXhwZWN0LWVycm9yXG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBJdCB3b24ndCBmYWlsIGxvbFxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGlkLnRvU3RyaW5nKCkuc3BsaXQoJ25vZGVfbW9kdWxlcy8nKVsxXS5zcGxpdCgnLycpWzBdLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgfSxcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgZGVmaW5lOiB7XG4gICAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9QWVJPREFDVFlMX1ZFUlNJT04nOiBKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbi52ZXJzaW9uKSxcbiAgICAgICAgJ2ltcG9ydC5tZXRhLmVudi5WSVRFX0NPTU1JVF9IQVNIJzogSlNPTi5zdHJpbmdpZnkoY29tbWl0SGFzaCksXG4gICAgICAgICdpbXBvcnQubWV0YS5lbnYuVklURV9CUkFOQ0hfTkFNRSc6IEpTT04uc3RyaW5naWZ5KGJyYW5jaE5hbWUpLFxuICAgICAgICAnaW1wb3J0Lm1ldGEuZW52LlZJVEVfUFlST0RBQ1RZTF9CVUlMRF9OVU1CRVInOiBKU09OLnN0cmluZ2lmeShwYWNrYWdlSnNvbi5idWlsZE51bWJlciksXG4gICAgICAgICdwcm9jZXNzLmVudic6IHt9LFxuICAgICAgICAncHJvY2Vzcy5wbGF0Zm9ybSc6IG51bGwsXG4gICAgICAgICdwcm9jZXNzLnZlcnNpb24nOiBudWxsLFxuICAgICAgICAncHJvY2Vzcy52ZXJzaW9ucyc6IG51bGwsXG4gICAgfSxcblxuICAgIHBsdWdpbnM6IFtcbiAgICAgICAgbGFyYXZlbCgncmVzb3VyY2VzL3NjcmlwdHMvaW5kZXgudHN4JyksXG4gICAgICAgIG1hbmlmZXN0U1JJKCksXG4gICAgICAgIFtcbiAgICAgICAgICAgIG1pbGxpb24udml0ZSh7XG4gICAgICAgICAgICAgICAgYXV0bzoge1xuICAgICAgICAgICAgICAgICAgICB0aHJlc2hvbGQ6IDAuMDEsXG4gICAgICAgICAgICAgICAgfSxcbiAgICAgICAgICAgICAgICB0ZWxlbWV0cnk6IGZhbHNlLFxuICAgICAgICAgICAgfSksXG4gICAgICAgICAgICByZWFjdCh7XG4gICAgICAgICAgICAgICAgcGx1Z2luczogW1xuICAgICAgICAgICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAgICAgICAgICAnQHN3Yy9wbHVnaW4tc3R5bGVkLWNvbXBvbmVudHMnLFxuICAgICAgICAgICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHB1cmU6IHRydWUsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbmFtZXNwYWNlOiAncHlyb2RhY3R5bCcsXG4gICAgICAgICAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9KSxcbiAgICAgICAgXSxcbiAgICBdLFxuXG4gICAgcmVzb2x2ZToge1xuICAgICAgICBhbGlhczoge1xuICAgICAgICAgICAgJ0AnOiByZXNvbHZlKGRpcm5hbWUoZmlsZVVSTFRvUGF0aChpbXBvcnQubWV0YS51cmwpKSwgJ3Jlc291cmNlcycsICdzY3JpcHRzJyksXG4gICAgICAgICAgICAnQGRlZmluaXRpb25zJzogcmVzb2x2ZShcbiAgICAgICAgICAgICAgICBkaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICAgICAgICAgJ3Jlc291cmNlcycsXG4gICAgICAgICAgICAgICAgJ3NjcmlwdHMnLFxuICAgICAgICAgICAgICAgICdhcGknLFxuICAgICAgICAgICAgICAgICdkZWZpbml0aW9ucycsXG4gICAgICAgICAgICApLFxuICAgICAgICAgICAgJ0BmZWF0dXJlJzogcmVzb2x2ZShcbiAgICAgICAgICAgICAgICBkaXJuYW1lKGZpbGVVUkxUb1BhdGgoaW1wb3J0Lm1ldGEudXJsKSksXG4gICAgICAgICAgICAgICAgJ3Jlc291cmNlcycsXG4gICAgICAgICAgICAgICAgJ3NjcmlwdHMnLFxuICAgICAgICAgICAgICAgICdjb21wb25lbnRzJyxcbiAgICAgICAgICAgICAgICAnc2VydmVyJyxcbiAgICAgICAgICAgICAgICAnZmVhdHVyZXMnLFxuICAgICAgICAgICAgKSxcbiAgICAgICAgfSxcbiAgICB9LFxuXG4gICAgc2VydmVyOiB7XG4gICAgICAgIHdhcm11cDoge1xuICAgICAgICAgICAgY2xpZW50RmlsZXM6IFtcbiAgICAgICAgICAgICAgICAncmVzb3VyY2VzL3NjcmlwdHMvaW5kZXgudHN4JyxcbiAgICAgICAgICAgICAgICAncmVzb3VyY2VzL3NjcmlwdHMvcm91dGVycy9EYXNoYm9hcmRSb3V0ZXIudHN4JyxcbiAgICAgICAgICAgICAgICAncmVzb3VyY2VzL3NjcmlwdHMvY29tcG9uZW50cy9kYXNoYm9hcmQvRGFzaGJvYXJkQ29udGFpbmVyLnRzeCcsXG4gICAgICAgICAgICAgICAgJ3Jlc291cmNlcy9zY3JpcHRzL3JvdXRlcnMvU2VydmVyUm91dGVyLnRzeCcsXG4gICAgICAgICAgICBdLFxuICAgICAgICB9LFxuICAgIH0sXG59KTtcbiIsICJ7XG4gICAgXCJuYW1lXCI6IFwicHlyb2RhY3R5bFwiLFxuICAgIFwidmVyc2lvblwiOiBcIjEuNy4wXCIsXG4gICAgXCJidWlsZE51bWJlclwiOiBcIjE3MDAwMFwiLFxuICAgIFwiZW5naW5lc1wiOiB7XG4gICAgICAgIFwibm9kZVwiOiBcIj49MjAuMFwiXG4gICAgfSxcbiAgICBcInR5cGVcIjogXCJtb2R1bGVcIixcbiAgICBcImRlcGVuZGVuY2llc1wiOiB7XG4gICAgICAgIFwiQGNvZGVtaXJyb3IvYXV0b2NvbXBsZXRlXCI6IFwiXjYuMTYuMFwiLFxuICAgICAgICBcIkBjb2RlbWlycm9yL2NvbW1hbmRzXCI6IFwiXjYuMy4zXCIsXG4gICAgICAgIFwiQGNvZGVtaXJyb3IvbGFuZ3VhZ2UtZGF0YVwiOiBcIl42LjUuMFwiLFxuICAgICAgICBcIkBjb2RlbWlycm9yL2xlZ2FjeS1tb2Rlc1wiOiBcIl42LjQuMFwiLFxuICAgICAgICBcIkBjb2RlbWlycm9yL2xpbnRcIjogXCJeNi41LjBcIixcbiAgICAgICAgXCJAY29kZW1pcnJvci9zZWFyY2hcIjogXCJeNi41LjZcIixcbiAgICAgICAgXCJAY29kZW1pcnJvci9zdGF0ZVwiOiBcIl42LjQuMVwiLFxuICAgICAgICBcIkBjb2RlbWlycm9yL3ZpZXdcIjogXCJeNi4yNi4zXCIsXG4gICAgICAgIFwiQGhlYWRsZXNzdWkvcmVhY3RcIjogXCJeMS43LjE4XCIsXG4gICAgICAgIFwiQHByZWFjdC9zaWduYWxzLXJlYWN0XCI6IFwiXjIuMC4xXCIsXG4gICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNoZWNrYm94XCI6IFwiXjEuMC40XCIsXG4gICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWNvbnRleHQtbWVudVwiOiBcIl4yLjEuNVwiLFxuICAgICAgICBcIkByYWRpeC11aS9yZWFjdC1kcm9wZG93bi1tZW51XCI6IFwiXjIuMC42XCIsXG4gICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LWljb25zXCI6IFwiXjEuMy4wXCIsXG4gICAgICAgIFwiQHJhZGl4LXVpL3JlYWN0LXN3aXRjaFwiOiBcIl4xLjAuM1wiLFxuICAgICAgICBcIkByYWRpeC11aS9yZWFjdC10YWJzXCI6IFwiXjEuMC40XCIsXG4gICAgICAgIFwiQHNlbnRyeS9yZWFjdFwiOiBcIl43LjExMC4wXCIsXG4gICAgICAgIFwiQHNlbnRyeS92aXRlLXBsdWdpblwiOiBcIl4yLjE2LjFcIixcbiAgICAgICAgXCJAdGFuc3RhY2svcmVhY3QtdmlydHVhbFwiOiBcIl4zLjIuMVwiLFxuICAgICAgICBcIkB4dGVybS9hZGRvbi1maXRcIjogXCJeMC4xMC4wXCIsXG4gICAgICAgIFwiQHh0ZXJtL2FkZG9uLXNlYXJjaFwiOiBcIl4wLjE1LjBcIixcbiAgICAgICAgXCJAeHRlcm0vYWRkb24td2ViLWxpbmtzXCI6IFwiXjAuMTEuMFwiLFxuICAgICAgICBcIkB4dGVybS94dGVybVwiOiBcIl41LjUuMFwiLFxuICAgICAgICBcImF4aW9zXCI6IFwiXjEuNi44XCIsXG4gICAgICAgIFwiYnJvd3NlcnNsaXN0XCI6IFwiXjQuMjMuMFwiLFxuICAgICAgICBcImNoYXJ0LmpzXCI6IFwiXjQuNC4yXCIsXG4gICAgICAgIFwiY2xzeFwiOiBcIl4yLjEuMFwiLFxuICAgICAgICBcImNtZGtcIjogXCJeMS4wLjBcIixcbiAgICAgICAgXCJjb3B5LXRvLWNsaXBib2FyZFwiOiBcIl4zLjMuM1wiLFxuICAgICAgICBcImRhdGUtZm5zXCI6IFwiXjMuNi4wXCIsXG4gICAgICAgIFwiZGVib3VuY2VcIjogXCJeMi4wLjBcIixcbiAgICAgICAgXCJkZWVwbWVyZ2UtdHNcIjogXCJeNS4xLjBcIixcbiAgICAgICAgXCJlYXN5LXBlYXN5XCI6IFwiXjYuMC40XCIsXG4gICAgICAgIFwiZXZlbnRzXCI6IFwiXjMuMy4wXCIsXG4gICAgICAgIFwiZm9ybWlrXCI6IFwiXjIuNC41XCIsXG4gICAgICAgIFwiZnJhbWVyLW1vdGlvblwiOiBcIl4xMS4wLjI4XCIsXG4gICAgICAgIFwibGFyYXZlbC12aXRlLXBsdWdpblwiOiBcIl4xLjAuMlwiLFxuICAgICAgICBcIm1pbGxpb25cIjogXCJeMy4wLjZcIixcbiAgICAgICAgXCJwYXRoZVwiOiBcIl4xLjEuMlwiLFxuICAgICAgICBcInFyY29kZS5yZWFjdFwiOiBcIl4zLjEuMFwiLFxuICAgICAgICBcInJlYWN0XCI6IFwiXjE4LjMuMFwiLFxuICAgICAgICBcInJlYWN0LWNoYXJ0anMtMlwiOiBcIl41LjIuMFwiLFxuICAgICAgICBcInJlYWN0LWRvbVwiOiBcIl4xOC4zLjBcIixcbiAgICAgICAgXCJyZWFjdC1mYXN0LWNvbXBhcmVcIjogXCJeMy4yLjJcIixcbiAgICAgICAgXCJyZWFjdC1yb3V0ZXItZG9tXCI6IFwiXjYuMjIuM1wiLFxuICAgICAgICBcInJlYXB0Y2hhXCI6IFwiXjEuMTIuMVwiLFxuICAgICAgICBcInNvY2tldHRlXCI6IFwiXjIuMC42XCIsXG4gICAgICAgIFwic29ubmVyXCI6IFwiXjEuNC40MVwiLFxuICAgICAgICBcInN0eWxlZC1jb21wb25lbnRzXCI6IFwiXjYuMS44XCIsXG4gICAgICAgIFwic3dyXCI6IFwiXjIuMi41XCIsXG4gICAgICAgIFwidGFpbHdpbmQtbWVyZ2VcIjogXCJeMi4yLjJcIixcbiAgICAgICAgXCJ0YWlsd2luZGNzc1wiOiBcIl4zLjQuM1wiLFxuICAgICAgICBcInRhaWx3aW5kY3NzLWFuaW1hdGVcIjogXCJeMS4wLjdcIixcbiAgICAgICAgXCJ1dWlkXCI6IFwiXjkuMC4xXCIsXG4gICAgICAgIFwidml0ZVwiOiBcIl41LjIuOFwiLFxuICAgICAgICBcInl1cFwiOiBcIl4xLjQuMFwiXG4gICAgfSxcbiAgICBcImRldkRlcGVuZGVuY2llc1wiOiB7XG4gICAgICAgIFwiQHN3Yy9wbHVnaW4tc3R5bGVkLWNvbXBvbmVudHNcIjogXCJeMS41LjEyMlwiLFxuICAgICAgICBcIkB0cml2YWdvL3ByZXR0aWVyLXBsdWdpbi1zb3J0LWltcG9ydHNcIjogXCJeNC4zLjBcIixcbiAgICAgICAgXCJAdHlwZXMvY29kZW1pcnJvclwiOiBcIl41LjYwLjE1XCIsXG4gICAgICAgIFwiQHR5cGVzL2RlYm91bmNlXCI6IFwiXjEuMi40XCIsXG4gICAgICAgIFwiQHR5cGVzL2V2ZW50c1wiOiBcIl4zLjAuM1wiLFxuICAgICAgICBcIkB0eXBlcy9ub2RlXCI6IFwiXjIwLjEyLjdcIixcbiAgICAgICAgXCJAdHlwZXMvcXJjb2RlLnJlYWN0XCI6IFwiXjEuMC41XCIsXG4gICAgICAgIFwiQHR5cGVzL3JlYWN0XCI6IFwiXjE4LjMuMFwiLFxuICAgICAgICBcIkB0eXBlcy9yZWFjdC1jb3B5LXRvLWNsaXBib2FyZFwiOiBcIl41LjAuN1wiLFxuICAgICAgICBcIkB0eXBlcy9yZWFjdC1kb21cIjogXCJeMTguMy4wXCIsXG4gICAgICAgIFwiQHR5cGVzL3JlYWN0LXJlZHV4XCI6IFwiXjcuMS4zM1wiLFxuICAgICAgICBcIkB0eXBlcy91dWlkXCI6IFwiXjkuMC44XCIsXG4gICAgICAgIFwiQHR5cGVzY3JpcHQtZXNsaW50L2VzbGludC1wbHVnaW5cIjogXCJeNy41LjBcIixcbiAgICAgICAgXCJAdHlwZXNjcmlwdC1lc2xpbnQvcGFyc2VyXCI6IFwiXjcuNS4wXCIsXG4gICAgICAgIFwiQHZpdGVqcy9wbHVnaW4tcmVhY3Qtc3djXCI6IFwiXjMuNi4wXCIsXG4gICAgICAgIFwiYXV0b3ByZWZpeGVyXCI6IFwiXjEwLjQuMTlcIixcbiAgICAgICAgXCJlc2xpbnRcIjogXCJeOC41Ny4wXCIsXG4gICAgICAgIFwiZXNsaW50LWNvbmZpZy1wcmV0dGllclwiOiBcIl45LjEuMFwiLFxuICAgICAgICBcImVzbGludC1wbHVnaW4tbm9kZVwiOiBcIl4xMS4xLjBcIixcbiAgICAgICAgXCJlc2xpbnQtcGx1Z2luLXByZXR0aWVyXCI6IFwiXjUuMS4zXCIsXG4gICAgICAgIFwiZXNsaW50LXBsdWdpbi1yZWFjdFwiOiBcIl43LjM0LjFcIixcbiAgICAgICAgXCJlc2xpbnQtcGx1Z2luLXJlYWN0LWhvb2tzXCI6IFwiXjQuNi4wXCIsXG4gICAgICAgIFwicG9zdGNzc1wiOiBcIl44LjQuMzhcIixcbiAgICAgICAgXCJwb3N0Y3NzLWltcG9ydFwiOiBcIl4xNi4xLjBcIixcbiAgICAgICAgXCJwb3N0Y3NzLW5lc3RpbmdcIjogXCJeMTIuMS4xXCIsXG4gICAgICAgIFwicG9zdGNzcy1wcmVzZXQtZW52XCI6IFwiXjkuNS41XCIsXG4gICAgICAgIFwicHJldHRpZXJcIjogXCJeMy4yLjVcIixcbiAgICAgICAgXCJwcmV0dGllci1wbHVnaW4tdGFpbHdpbmRjc3NcIjogXCJeMC41LjEzXCIsXG4gICAgICAgIFwidGFpbHdpbmRjc3MtaW5uZXItYm9yZGVyXCI6IFwiXjAuMi4wXCIsXG4gICAgICAgIFwidHMtZXNzZW50aWFsc1wiOiBcIl45LjQuMlwiLFxuICAgICAgICBcInR5cGVzY3JpcHRcIjogXCJeNS40LjVcIixcbiAgICAgICAgXCJ2aXRlLXBsdWdpbi1tYW5pZmVzdC1zcmlcIjogXCJeMC4yLjBcIlxuICAgIH0sXG4gICAgXCJzY3JpcHRzXCI6IHtcbiAgICAgICAgXCJsaW50XCI6IFwiZXNsaW50IC4vcmVzb3VyY2VzL3NjcmlwdHMvKiovKi57dHMsdHN4fSAtLWV4dCAudHMsLnRzeCAtLWZpeFwiLFxuICAgICAgICBcImxpbnQ6dHVyYm9cIjogXCJ0dXJibyBsaW50XCIsXG4gICAgICAgIFwiZGV2XCI6IFwidml0ZVwiLFxuICAgICAgICBcImJ1aWxkXCI6IFwidml0ZSBidWlsZFwiLFxuICAgICAgICBcImJ1aWxkOnR1cmJvXCI6IFwidHVyYm8gYnVpbGRcIixcbiAgICAgICAgXCJzaGlwXCI6IFwidHVyYm8gbGludCBidWlsZFwiXG4gICAgfSxcbiAgICBcImJyb3dzZXJzbGlzdFwiOiBbXG4gICAgICAgIFwiPiAwLjUlXCIsXG4gICAgICAgIFwibGFzdCAyIHZlcnNpb25zXCIsXG4gICAgICAgIFwiZmlyZWZveCBlc3JcIixcbiAgICAgICAgXCJub3QgZGVhZFwiXG4gICAgXVxufVxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUEwVyxPQUFPLFdBQVc7QUFDNVgsWUFBWSxXQUFXO0FBQ3ZCLE9BQU8sYUFBYTtBQUNwQixPQUFPLGFBQWE7QUFDcEIsU0FBUyxxQkFBcUI7QUFDOUIsU0FBUyxTQUFTLGVBQWU7QUFDakMsU0FBUyxvQkFBb0I7QUFDN0IsT0FBTyxpQkFBaUI7OztBQ1B4QjtBQUFBLEVBQ0ksTUFBUTtBQUFBLEVBQ1IsU0FBVztBQUFBLEVBQ1gsYUFBZTtBQUFBLEVBQ2YsU0FBVztBQUFBLElBQ1AsTUFBUTtBQUFBLEVBQ1o7QUFBQSxFQUNBLE1BQVE7QUFBQSxFQUNSLGNBQWdCO0FBQUEsSUFDWiw0QkFBNEI7QUFBQSxJQUM1Qix3QkFBd0I7QUFBQSxJQUN4Qiw2QkFBNkI7QUFBQSxJQUM3Qiw0QkFBNEI7QUFBQSxJQUM1QixvQkFBb0I7QUFBQSxJQUNwQixzQkFBc0I7QUFB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
