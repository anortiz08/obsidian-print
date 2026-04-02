# AGENTS

## Release Flow

When preparing a release for this plugin:

1. Update `CHANGELOG.md` with a new version heading and the user-visible changes.
2. Bump `package.json`, `manifest.json`, and `versions.json`.
   You can use `npm run version -- <version>` for this repo.
3. Run `npm test` and `npm run build`.
4. Commit all release changes together.
5. Push the branch to `origin`.
6. Create an annotated git tag that matches the release version, for example `0.4.1`.
7. Push the new tag to `origin`.

## Notes

- Keep release tags in the `x.y.z` format used by the existing history.
- Do not create the tag until the changelog and version files are updated.
- If the repo already contains unrelated user changes, do not revert them; release only after confirming the intended scope.
