const fs = require("fs");
const path = require("path");

const gradlePropsPath = path.join(
  __dirname,
  "..",
  "android",
  "gradle",
  "wrapper",
  "gradle-wrapper.properties"
);

if (fs.existsSync(gradlePropsPath)) {
  let content = fs.readFileSync(gradlePropsPath, "utf8");
  const updated = content.replace(
    /distributionUrl=.*gradle-([\d.]+)-bin\.zip/,
    (match, version) => {
      // Only downgrade if current version is 9.x
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
    console.log(`[fix-gradle] No change needed (Gradle version is not 9.x)`);
  }
} else {
  console.log(`[fix-gradle] File not found: ${gradlePropsPath}`);
}
