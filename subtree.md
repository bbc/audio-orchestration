This repository uses `git-subtree` to store source code and patches for some internal dependencies.

The following setup is only required to contribute changes back to the original repositories. None
of this is needed to just build and run the `bbcat-orchestration` library or examples.

## bbcat-js

Initial setup:

```sh
git remote add -f bbcat-js git@github.com:bbc/bbcat-js.git
git subtree add --prefix bbcat-js bbcat-js kh_mdo_vostok --squash

```

Pull changes from the upstream branch:

```sh
git fetch bbcat-js kh_mdo_vostok
git subtree pull --prefix bbcat-js bbcat-js kh_mdo_vostok --squash
```

Push changes to a branch (not master!) to open a pull request:

```sh
git subtree push --prefix bbcat-js bbcat-js kh_mdo_vostok
```
