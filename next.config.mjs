/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  serverExternalPackages: ["qrcode", "pg"],
};

export default nextConfig;
