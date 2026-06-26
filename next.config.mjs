/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Saída autossuficiente para uma imagem Docker mínima (server.js).
  output: "standalone",
};

export default nextConfig;
