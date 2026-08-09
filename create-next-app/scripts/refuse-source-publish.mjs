console.error(
  "Refusing to publish the repository package directory. " +
  "Run npm run pack:release, then publish the reported tarball path.",
);
process.exit(1);
