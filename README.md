# matrix-logs

### Requirements:

- [Bun](https://bun.com)

### To install dependencies:

```bash
bun install
```

### To run:

```bash
some-command | bun dev
```

### To build:

```bash
bun run build
```

### To run the built binary:

```bash
some-command | dist/matrix-logs
```

## After building, add an alias to your shell config to make it easier to use:

**zsh:**

```sh
echo 'alias mlogs="'$(pwd)'/dist/matrix-logs"' >> ~/.zshrc && source ~/.zshrc
```

**bash:**

```sh
echo 'alias mlogs="'$(pwd)'/dist/matrix-logs"' >> ~/.bashrc && source ~/.bashrc
```

**fish:**

```sh
echo 'alias mlogs="'$(pwd)'/dist/matrix-logs"' >> ~/.config/fish/config.fish && source ~/.config/fish/config.fish
```

---

This project was created using `bun init` in bun v1.3.14. [Bun](https://bun.com) is a fast all-in-one JavaScript runtime.
