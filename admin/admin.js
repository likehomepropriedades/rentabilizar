const backendUrl = 'https://script.google.com/macros/s/SEU_DEPLOY_URL/exec';

function carregarCampos() {
  fetch(`${backendUrl}?action=get`)
    .then(res => res.json())
    .then(dados => {
      Object.entries(dados).forEach(([chave, valor]) => {
        const campo = document.querySelector(`[name="${chave}"]`);
        if (campo) campo.value = valor;
      });
    });
}

document.getElementById('formulario').addEventListener('submit', e => {
  e.preventDefault();
  const dados = Object.fromEntries(new FormData(e.target).entries());

  fetch(backendUrl, {
    method: 'POST',
    body: JSON.stringify(dados),
  }).then(() => alert("Conteúdo salvo com sucesso!"));
});

window.onload = carregarCampos;