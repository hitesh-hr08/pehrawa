const fs = require("fs");
const path = require("path");

console.log(`[fix-gradle] CWD: ${process.cwd()}`);
console.log(`[fix-gradle] __dirname: ${__dirname}`);

const rootDir = (() => {
  if (fs.existsSync(path.join(__dirname, "..", "android"))) return path.join(__dirname, "..");
  if (fs.existsSync(path.join(process.cwd(), "android"))) return process.cwd();
  return __dirname;
})();

console.log(`[fix-gradle] rootDir: ${rootDir}`);

const androidDir = path.join(rootDir, "android");
if (!fs.existsSync(androidDir)) {
  console.log(`[fix-gradle] android/ directory NOT FOUND at ${androidDir}`);
  if (fs.existsSync(rootDir)) {
    const contents = fs.readdirSync(rootDir).filter(f => !f.startsWith("node_modules"));
    console.log(`[fix-gradle] rootDir contents: ${contents.join(", ")}`);
  }
  process.exit(0);
}

// 1. Downgrade Gradle from 9.x to 8.10.2 (safer with Kotlin plugin versions)
const gradlePropsPath_wrapper = path.join(androidDir, "gradle", "wrapper", "gradle-wrapper.properties");
if (fs.existsSync(gradlePropsPath_wrapper)) {
  let content = fs.readFileSync(gradlePropsPath_wrapper, "utf8");
  const updated = content.replace(
    /distributionUrl=.*gradle-([\d.]+)-bin\.zip/,
    (match, version) => {
      if (version.startsWith("9.")) {
        console.log(`[fix-gradle] Downgrading Gradle from ${version} to 8.13`);
        return match.replace(version, "8.13");
      }
      console.log(`[fix-gradle] Gradle ${version} is already <9.x, keeping`);
      return match;
    }
  );
  if (content !== updated) {
    fs.writeFileSync(gradlePropsPath_wrapper, updated, "utf8");
    console.log(`[fix-gradle] Updated gradle-wrapper.properties`);
  } else {
    console.log(`[fix-gradle] No Gradle downgrade needed`);
  }
}

// 2. Fix Kotlin serialization plugin version in expo-autolinking-plugin-shared
const findSerializationFile = () => {
  const searchPaths = [
    path.join(rootDir, "node_modules", "expo-modules-autolinking", "android", "expo-gradle-plugin", "expo-autolinking-plugin-shared", "build.gradle.kts"),
    path.join(rootDir, "node_modules", "expo-modules-autolinking", "android", "expo-gradle-plugin", "expo-autolinking-plugin-shared", "shared", "build.gradle.kts"),
  ];
  for (const p of searchPaths) {
    if (fs.existsSync(p)) return p;
  }
  // Search recursively in node_modules/expo-modules-autolinking
  const baseDir = path.join(rootDir, "node_modules", "expo-modules-autolinking");
  if (fs.existsSync(baseDir)) {
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          const found = walk(full);
          if (found) return found;
        } else if (entry.name === "build.gradle.kts") {
          const content = fs.readFileSync(full, "utf8");
          if (content.includes("plugin.serialization")) return full;
        }
      }
      return null;
    };
    return walk(baseDir);
  }
  return null;
};

const serializationFile = findSerializationFile();
if (serializationFile) {
  let content = fs.readFileSync(serializationFile, "utf8");
  console.log(`[fix-gradle] Found serialization file: ${serializationFile}`);
  
  // Replace the hardcoded version with the Kotlin version from gradle.properties
  const updated = content.replace(
    /kotlin\("plugin\.serialization"\) version "([^"]+)"/,
    (match, version) => {
      if (version !== "2.1.20") {
        console.log(`[fix-gradle] Changing kotlin serialization plugin from ${version} to 2.1.20`);
        return `kotlin("plugin.serialization") version "2.1.20"`;
      }
      console.log(`[fix-gradle] Kotlin serialization plugin already at 2.1.20`);
      return match;
    }
  );
  if (content !== updated) {
    fs.writeFileSync(serializationFile, updated, "utf8");
    console.log(`[fix-gradle] Updated: ${serializationFile}`);
  }
} else {
  console.log(`[fix-gradle] expo-autolinking-plugin-shared/build.gradle.kts NOT FOUND`);
}

// 3. Add Kotlin metadata version compatibility check suppression
const gradlePropsPath = path.join(androidDir, "gradle.properties");
if (fs.existsSync(gradlePropsPath)) {
  let content = fs.readFileSync(gradlePropsPath, "utf8");
  const flag = "kotlin.compiler.suppressKotlinVersionCompatibilityCheck=true";
  if (!content.includes(flag)) {
    content += "\n" + flag + "\n";
    fs.writeFileSync(gradlePropsPath, content, "utf8");
    console.log(`[fix-gradle] Added Kotlin metadata version check suppression to gradle.properties`);
  } else {
    console.log(`[fix-gradle] Kotlin suppression already present in gradle.properties`);
  }
  
  // Also ensure kotlinVersion is reasonable
  if (content.includes("android.kotlinVersion=2.0.21")) {
    content = content.replace("android.kotlinVersion=2.0.21", "android.kotlinVersion=2.1.20");
    fs.writeFileSync(gradlePropsPath, content, "utf8");
    console.log(`[fix-gradle] Updated android.kotlinVersion from 2.0.21 to 2.1.20`);
  }
}

console.log(`[fix-gradle] Done`);
