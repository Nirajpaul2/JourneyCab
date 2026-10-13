import { proxyApi } from "./api-proxy.js";

export default {
  fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/api" || path.startsWith("/api/")) return proxyApi(request, env);
    return env.ASSETS.fetch(request);
  },
};
