const fs = require("fs");
const path = require("path");

console.log(`[fix-gradle] CWD: ${process.cwd()}`);
console.log(`[fix-gradle] __dirname: ${__dirname}`);

// Try the android/ directory relative to project root
const rootDir = (() => {
  if (fs.existsSync(path.join(__dirname, "..", "android"))) return path.join(__dirname, "..");
  if (fs.existsSync(path.join(process.cwd(), "android"))) return process.cwd();
  return __dirname;
})();

console.log(`[fix-gradle] rootDir: ${rootDir}`);

const androidDir = path.join(rootDir, "android");
if (!fs.existsSync(androidDir)) {
  console.log(`[fix-gradle] android/ directory NOT FOUND at ${androidDir}`);
  // List what's in rootDir to debug
  if (fs.existsSync(rootDir)) {
    const contents = fs.readdirSync(rootDir).filter(f => !f.startsWith("node_modules"));
    console.log(`[fix-gradle] rootDir contents: ${contents.join(", ")}`);
  }
  process.exit(0);
}

// 1. Fix Gradle version: downgrade 9.x to 8.10.2
const gradlePropsPath = path.join(androidDir, "gradle", "wrapper", "gradle-wrapper.properties");
if (fs.existsSync(gradlePropsPath)) {
  let content = fs.readFileSync(gradlePropsPath, "utf8");
  const updated = content.replace(
    /distributionUrl=.*gradle-([\d.]+)-bin\.zip/,
    (match, version) => {
      if (version.startsWith("9.")) {
        console.log(`[fix-gradle] Downgrading Gradle from ${version} to 8.10.2`);
        return match.replace(version, "8.10.2");
      }
      return match;
    }
  );
  if (content !== updated) {
    fs.writeFileSync(gradlePropsPath, updated, "utf8");
    console.log(`[fix-gradle] Updated: ${gradlePropsPath}`);
  } else {
    console.log(`[fix-gradle] No Gradle downgrade needed`);
  }
} else {
  console.log(`[fix-gradle] gradle-wrapper.properties NOT found at ${gradlePropsPath}`);
}

// 2. Suppress Kotlin metadata version check as safety net
const gradleProps = path.join(androidDir, "gradle.properties");
if (fs.existsSync(gradleProps)) {
  let content = fs.readFileSync(gradleProps, "utf8");
  const flag = "kotlin.compiler.suppressKotlinVersionCompatibilityCheck=true";
  if (!content.includes(flag)) {
    content += "\n" + flag + "\n";
    fs.writeFileSync(gradleProps, content, "utf8");
    console.log(`[fix-gradle] Added Kotlin metadata version check suppression to gradle.properties`);
  } else {
    console.log(`[fix-gradle] Kotlin suppression already present in gradle.properties`);
  }
}

console.log(`[fix-gradle] Done`);
