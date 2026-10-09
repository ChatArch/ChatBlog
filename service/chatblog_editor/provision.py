"""Provision one editor account without putting plaintext passwords in argv or source."""
from __future__ import annotations

import getpass
import json
import os
from pathlib import Path

from chatlogin import hash_password


def main() -> None:
    directory = Path(os.environ.get("CHATBLOG_STATE_DIR") or
                     Path(os.environ.get("CHATARCH_HOME") or Path.home() / ".chatarch") / "chatblog-editor")
    directory.mkdir(mode=0o700, parents=True, exist_ok=True)
    if directory.is_symlink() or directory.stat().st_mode & 0o777 != 0o700:
        raise SystemExit("State directory must be real and mode 0700")
    username = input("Editor username: ").strip()
    if not username or len(username.encode('utf-8')) > 256:
        raise SystemExit("Invalid username")
    first = getpass.getpass("New password: ")
    second = getpass.getpass("Repeat password: ")
    if first != second or len(first) < 12:
        raise SystemExit("Passwords must match and contain at least 12 characters")
    password = hash_password(first)
    first = second = ""
    data = {"username": username, "salt_hex": password.salt.hex(),
            "digest_hex": password.digest.hex(), "iterations": password.iterations}
    path = directory / "editor.json"
    fd = os.open(path, os.O_WRONLY | os.O_CREAT | os.O_EXCL | getattr(os, "O_NOFOLLOW", 0), 0o600)
    with os.fdopen(fd, "w", encoding="utf-8") as stream:
        json.dump(data, stream)
    print("Editor credential created; no plaintext password stored.")


if __name__ == "__main__":
    main()
