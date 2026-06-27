const Module = require("module");
const orig = Module._resolveFilename;
Module._resolveFilename = function (request, parent, isMain, options) {
  try {
    return orig.call(this, request, parent, isMain, options);
  } catch (e) {
    if (e.code === "ERR_PACKAGE_PATH_NOT_EXPORTED") {
      const path = require("path");
      const fs = require("fs");
      const parts = request.split("/");
      const pkgName = parts[0].startsWith("@") ? parts[0] + "/" + parts[1] : parts[0];
      const rest = parts.slice(pkgName.includes("/") ? 2 : 1).join("/");
      try {
        const pkgJson = require.resolve(pkgName + "/package.json");
        const base = path.dirname(pkgJson);
        const trials = [path.join(base, rest), path.join(base, rest + ".js"), path.join(base, rest + ".json")];
        for (const trial of trials) {
          try {
            if (fs.statSync(trial).isFile()) {
              return trial;
            }
          } catch (_) {}
        }
      } catch (_) {}
    }
    throw e;
  }
};
