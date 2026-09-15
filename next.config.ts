import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone 输出：支持 Docker / Node 服务器自托管部署（见 Dockerfile）
  output: "standalone",
};

export default nextConfig;
