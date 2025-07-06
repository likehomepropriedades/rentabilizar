# rentabilizar

🎨 Design System – Landing Page rentabilizar.likehomepropriedades.com.br

🧾 1. Identidade Visual

Fonte Principal: Titillium Web (Google Fonts)
Estilo visual: Moderno, elegante, com contraste entre seções claras e escuras, imagens com aspecto cinematográfico e uso recorrente de bordas arredondadas e sombras suaves.

🎨 2. Paleta de Cores

Nome

HEX

Uso Principal

Branco Claro

#f4f4f4

Fundo principal, texto claro

Preto Absoluto

#000000

Header, footer, contrastes importantes

Marrom/Destaque

#9f5c39

Subtítulo de seções, botões secundários

Cinza Escuro

#333333

Texto padrão

Cinza Médio

#ccc

Placeholders, ícones de formulário

Transparente Preto

rgba(0, 0, 0, 0.8)

Fundos escuros do formulário

🔤 3. Tipografia

Fonte: 'Titillium Web', Arial, sans-serif

Elemento

Tamanho Base

Peso

Uso

h1, h2

clamp

600 a 900

Títulos das seções

Parágrafo

1.1rem

400

Texto corrido padrão

Botões e Labels

16–18px

600

Chamadas e campos do formulário

🧱 4. Componentes UI

✅ Botões

.btn-link-sobre e .btn-link-numeros: botões claros com hover escuro, ou vice-versa.

.btn-submit: fundo branco, texto preto, hover invertido.

✅ Campos de Formulário

Fundo transparente, borda branca, texto branco.

Input, textarea, select estilizados de forma coerente e acessível.

Placeholder em cinza claro.

✅ Cards / Grupos

#unidade-vantagem, #container_itens_nossos_numeros: exibição em grid/flex com espaçamentos responsivos.

✅ Modal

Fundo escuro com opacidade.

.modal-content: caixa branca com cantos arredondados.

📐 5. Layout

Estrutura:

header: fixo, preto com sombra.

main: sem padding extra.

section: espaçamentos variáveis conforme tipo.

footer: fundo preto, conteúdo flex.

Breakpoints:

1200px (desktop médio)

992px (tablet)

768px (mobile horizontal)

600px (mobile vertical)

🧩 6. Seções

🖼️ Imagem Principal

#container_img_principal + #img_principal + #sobreposicao

Sobreposição com fundo SVG + texto alinhado à esquerda

🧾 Sobre

#container_sobre: flex wrap horizontal

.img-container-sobre: imagem com border-radius 15px

✅ Vantagens

Grid com 3 colunas, reduz para 2 e 1 em breakpoints menores

#parte-vantagens com padding

💻 Acesso Plataforma

Imagem + conteúdo lado a lado, com #img-acesso-pc sobreposto

📊 Nossos Números

Fundo com imagem + layer branco semitransparente

#container_itens_nossos_numeros: caixa com transparência e texto

🧰 Nossos Serviços

Flex entre texto à esquerda e imagem à direita (coluna reversa no mobile)

📩 Quero Rentabilizar

Fundo com imagem + formulário escuro

.form-container: fundo preto semi-transparente, campos brancos

📱 7. Responsividade

Mobile-first com ajustes em max-width:

Empilhamento de colunas

Redução de paddings

Tamanhos de fonte ajustados com clamp

Modal adaptável

♿ 8. Acessibilidade

label sempre associado a campos

Placeholder visível e com contraste

Botões acessíveis via teclado

Estrutura semântica correta

🧩 9. Utilitários CSS

.titillium-web-bold, .titillium-web-light-italic etc. para pesos

Classes específicas de grid (como .dupla, .grid-campos)

scroll-margin-top aplicado nas seções

📦 10. Assets e Caminhos

Imagens: img/ (carregadas via URL GitHub)

Fontes: Google Fonts

Backgrounds: SVGs locais ou imagens externas do GitHub

Layout fixo: header e footer

✅ 11. Regras Especiais

body.loaded #img_principal: aplica efeito de zoom

Botões .hover: sempre invertendo contraste

#parte-nossos-numeros::before: camada de opacidade

Este design system é a base visual e comportamental da landing page e deve ser seguido para manter consistência em novas seções, melhorias e testes futuros.