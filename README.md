# Portfólio — Nathan Zurita

Site estático (HTML, CSS e JavaScript), sem build. Bibliotecas via CDN: Three.js, GSAP e Lenis.

- `index.html` — conteúdo de todas as seções
- `style.css` — estilos e responsividade
- `main.js` — animações (GSAP + Lenis), cursor, menu e interações
- `scene.js` — cena 3D de fundo em Three.js
- `assets/Curriculo-Nathan-Zurita.pdf` — currículo para download

## Rodar localmente

```bash
npx http-server . -p 5500
```

## Publicar no GitHub Pages

1. Crie um repositório público chamado `Nathan-Zurita-Student.github.io`.
2. Envie estes arquivos para a branch `main`.
3. Em **Settings → Pages**, escolha `Deploy from a branch` → `main` / `root`.
4. O site fica em `https://nathan-zurita-student.github.io`.
