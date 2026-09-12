const path = require("path");
const fs = require("fs");
const paths = require("react-scripts/config/paths");

                                                                      
                                                  
const pnpmDir = path.join(__dirname, "node_modules", ".pnpm");
const requireFromPnpm = (pkgName) => {
  try {
    return require(pkgName);
  } catch (err) {
    if (!fs.existsSync(pnpmDir)) throw err;
    const pkgDirName = pkgName.replace(/^(@[^/]+)\//, "$1+");
    const matches = fs
      .readdirSync(pnpmDir)
      .filter((d) => d.startsWith(pkgDirName + "@"));
    if (matches.length === 0) throw err;
    return require(path.join(pnpmDir, matches[0], "node_modules", pkgName));
  }
};

const HtmlWebpackPlugin = requireFromPnpm("html-webpack-plugin");
const { WebpackManifestPlugin } = requireFromPnpm("webpack-manifest-plugin");
const MiniCssExtractPlugin = requireFromPnpm("mini-css-extract-plugin");
                                      

console.log("process.env.REACT_APP_CLIENT", process.env.REACT_APP_CLIENT);

                                                                         
const extWebpack = (config, env) => {
  const isEnvProduction = env === "production";
                             
  const minify = isEnvProduction && {
    removeComments: true,
    collapseWhitespace: true,
    removeRedundantAttributes: true,
    useShortDoctype: true,
    removeEmptyAttributes: true,
    removeStyleLinkTypeAttributes: true,
    keepClosingSlash: true,
    minifyJS: true,
    minifyCSS: true,
    minifyURLs: true,
  };
                                    
  const names = [
    "HtmlWebpackPlugin",
    "WebpackManifestPlugin",
    "MiniCssExtractPlugin",
  ];

                               
  config.entry = {
    popup: paths.appSrc + "/popup.js",          
    options: paths.appSrc + "/options.js",          
    background: paths.appSrc + "/background.js",            
    content: paths.appSrc + "/content.js",                               
    "content-ui": paths.appSrc + "/content-ui.js",                                                
    "injector-shadowroot": paths.appSrc + "/injector-shadowroot.js",                     
  };

                                                           
  config.output.filename = "[name].js";
  config.output.assetModuleFilename = "media/[name][ext]";

                                               
                                                                      
                               
  config.output.globalObject = "globalThis";

                                             
                                                   
                                                                      
                                                            
                          
  config.output.environment = {
    ...(config.output.environment || {}),
    globalThis: true,
  };


                                                                                                        
  config.optimization.splitChunks = { cacheGroups: { default: false } };
  config.optimization.runtimeChunk = false;                   

                                       
  config.plugins = config.plugins.filter(
    (plugin) => !names.includes(plugin.constructor.name)
  );

                      
  config.plugins.push(
                       
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ["options"],
      template: paths.appHtml,
      filename: "options.html",
      minify,
    }),
                        
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ["popup"],
      template: paths.appHtml,
      filename: "popup.html",
      minify,
    }),
    new WebpackManifestPlugin({
      fileName: "asset-manifest.json",
    }),
    new MiniCssExtractPlugin({
      filename: "css/[name].css",
    })
  );

  return config;
};

                              
const webWebpack = (config, env) => {
  const names = ["HtmlWebpackPlugin"];

  config.entry = {
    main: paths.appIndexJs,
    options: paths.appSrc + "/options.js",
    content: paths.appSrc + "/content.js",
    "content-ui": paths.appSrc + "/content-ui.js",                          
  };

  config.output.filename = "[name].js";
  config.output.publicPath = "/";

  config.plugins = config.plugins.filter(
    (plugin) => !names.includes(plugin.constructor.name)
  );

  config.plugins.push(
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ["main"],
      template: paths.appHtml,
      filename: "index.html",
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ["options"],
      template: paths.appHtml,
      filename: "options.html",
    }),
    new HtmlWebpackPlugin({
      inject: true,
      chunks: ["content"],
      template: paths.appPublic + "/content.html",
      filename: "content.html",
    })
  );

  return config;
};

                                                    
let webpackConfig;
switch (process.env.REACT_APP_CLIENT) {
  case "web":
    webpackConfig = webWebpack;
    break;
  default:
    webpackConfig = extWebpack;
}

module.exports = {
  webpack: webpackConfig,
  devServer: (configFunction) => (proxy, allowedHost) => {
    const config = configFunction(proxy, allowedHost);
    const onBeforeSetupMiddleware = config.onBeforeSetupMiddleware;
    const onAfterSetupMiddleware = config.onAfterSetupMiddleware;
    const setupMiddlewares = config.setupMiddlewares;

    if (onBeforeSetupMiddleware || onAfterSetupMiddleware) {
      config.setupMiddlewares = (middlewares, devServer) => {
        if (onBeforeSetupMiddleware) onBeforeSetupMiddleware(devServer);
        const nextMiddlewares = setupMiddlewares
          ? setupMiddlewares(middlewares, devServer)
          : middlewares;
        if (onAfterSetupMiddleware) onAfterSetupMiddleware(devServer);
        return nextMiddlewares;
      };
      delete config.onBeforeSetupMiddleware;
      delete config.onAfterSetupMiddleware;
    }

    return config;
  },
};
