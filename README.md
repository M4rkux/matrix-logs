# matrix-logs

A intenção deste projeto é transformar um log eficiente e sem graça em um log no estilo Matrix, não vai ficar muito legível, porém vai ficar aesthetic!

Disso aqui:

```sh
ping codecon.dev
```

<img width="1100" height="462" alt="image" src="https://github.com/user-attachments/assets/f6567c76-8b48-4541-81b5-44a3ec2effb7" />

Para isso aqui:

```
ping codecon.dev | bun dev
```

<img width="1100" height="462" alt="image" src="https://github.com/user-attachments/assets/37ada89d-ecc2-46e2-a786-0bd1eb27592e" />

### Requisitos:

- [Bun](https://bun.com)

### Instalar dependências:

```bash
bun install
```

### Executar o projeto:

```bash
comando | bun dev
```

### Debug:

Primeiro é necessário subir o servidor de debug:

```bash
bun run debug-server
```

Depois, em outro terminal, execute o projeto com o comando `debug`:

```bash
comando | bun debug
```

### Build:

```bash
bun run build
```

### Executar o binário:

```bash
comando | ./dist/matrix-logs
```

## Depois de buildar, adicione um alias no shell pra ficar mais fácil de usar:

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
