/**
 * @type {import('@remix-run/dev').AppConfig}
 */
module.exports = {
  future: {
    v2_errorBoundary: false,
    v2_headers: false,
    v2_meta: false,
    v2_normalizeFormMethod: false,
    v2_routeConvention: false,
    v2_dev: false,
  },
  tailwind: true,
  postcss: true,
  serverModuleFormat: "cjs",
  serverDependenciesToBundle: ["axios"],
};
