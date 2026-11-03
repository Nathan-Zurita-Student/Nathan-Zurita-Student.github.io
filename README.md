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

## Imagem de prévia (LinkedIn/WhatsApp)

`assets/og-image.jpg` é gerada a partir de `tools/og-image.html`. Com o servidor local rodando:

```bash
"/c/Program Files/Google/Chrome/Application/chrome.exe" --headless=new --enable-unsafe-swiftshader --use-angle=swiftshader --hide-scrollbars --window-size=1200,630 --virtual-time-budget=9000 --screenshot=assets/og-image.png http://localhost:5500/tools/og-image.html
```

Depois converta para JPG (abaixo de 300 KB, por causa do WhatsApp). Se o domínio mudar, atualize as URLs `og:*` no `index.html`.
