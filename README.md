# 🤖 Daily Slack Notification – O assistente diário para o Slack

O **Daily Slack Notification** é um bot automatizado para o Slack que agenda e anuncia a reunião diária de *stand-up*, destacando quem será responsável pela apresentação do dia. 🚀

Este projeto oferece duas opções de integração:

1. **Python + GitHub Actions + Slack API**, usando um Slack App e um token de autenticação.
2. **Google Apps Script + Slack Workflow + Webhook**, sem a necessidade de manter um ambiente Python ou um workflow do GitHub Actions.

---

## 📌 Como criar uma API do Slack para este bot?

Para usar este bot, você precisará criar um Slack App e obter os tokens necessários. Consulte a documentação oficial do Slack:
🔗 [Criar um Slack App](https://api.slack.com/apps)

O processo é totalmente automatizado por meio do GitHub Actions, permitindo a execução diária agendada via tarefas cron ou a execução manual sempre que necessário.

---

## 📌 Funcionalidades

- ✅ Anúncio diário automático no Slack.
- ✅ Seleção sequencial do apresentador entre os membros configurados.
- ✅ Menção correta do apresentador no Slack (usando IDs de usuário).
- ✅ Execução automatizada via GitHub Actions com suporte a agendamento (cron).
- ✅ Execução manual via `workflow_dispatch` do GitHub Actions.
- ✅ Integração alternativa via Google Apps Script, Slack Workflow e Webhook.

---

## 🛠 Tecnologias utilizadas

Este projeto foi desenvolvido usando:

- **Python 3.9**
- **GitHub Actions** (para automação da execução)
- **Requests** (para integração com a API do Slack)
- **Google Apps Script** (alternativa de automação)
- **Slack Workflow Builder** (recebimento do apresentador via Webhook)

---

## 📂 Estrutura do projeto

O projeto segue a estrutura abaixo:

```
.
├── .github/workflows/       # Configuração do GitHub Actions
│   ├── ci.yaml              # Workflow para execução automatizada
├── scripts/                 # Scripts de automação
│   ├── daily_slack.py       # Script responsável por enviar mensagens ao Slack
│   ├── daily_slack_bot.js   # Alternativa usando Google Apps Script
├── .gitignore               # Arquivo para ignorar arquivos desnecessários no repositório
├── LICENSE                  # Licença do projeto
├── README.md                # Documentação do projeto
```

---

## 🔄 Lógica de seleção do apresentador

O apresentador do dia é selecionado sequencialmente, garantindo um rodízio justo entre os membros.

### 📌 Como funciona?

O script mantém uma lista pré-configurada de membros da equipe (por meio de `SLACK_MEMBERS`) e seleciona o próximo da fila a cada dia. Quando todos os membros tiverem apresentado, a ordem é reiniciada desde o início.

---

### 🔹 Exemplo:

Se `SLACK_MEMBERS="U123456,U654321,U987654"`, a ordem das apresentações será:

1️⃣ Dia 1: U123456
2️⃣ Dia 2: U654321
3️⃣ Dia 3: U987654
4️⃣ Dia 4: U123456 (reinicia)

Essa lógica garante um rodízio justo e evita seleções aleatórias.

---

## 🚀 Configuração e uso

### 1️⃣ Pré-requisitos

Antes de executar o script, certifique-se de que você possui:

- Python 3.9 ou superior instalado.
- Um bot do Slack configurado com permissão para enviar mensagens.
- As seguintes variáveis de ambiente configuradas no GitHub Actions:

| Variável         | Descrição                                  |
|------------------|--------------------------------------------|
| `SLACK_TOKEN`    | Token de autenticação do Slack             |
| `CHANNEL_ID`     | ID do canal onde a mensagem será enviada   |
| `SLACK_MEMBERS`  | Lista de IDs dos membros para apresentação, separados por vírgulas |

💡 **Como obter os IDs de usuários do Slack?**
Se você precisar dos IDs de usuários, use a API do Slack:
🔗 [Obter lista de usuários do Slack](https://api.slack.com/methods/users.list)

### 2️⃣ Como executar o projeto localmente?

1️⃣ Clone o repositório:

```sh
git clone https://github.com/your-username/daily-slack-notification.git
cd daily-slack-notification
```

2️⃣ Crie e ative um ambiente virtual:

```sh
python -m venv venv
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows
```

3️⃣ Instale as dependências:

```sh
pip install -r requirements.txt
```

4️⃣ Defina as variáveis de ambiente:

```sh
export SLACK_TOKEN="your_token_here"
export CHANNEL_ID="your_channel_id_here"
export SLACK_MEMBERS="U12345,U67890,U54321"
```

💡 No Windows, use:

```sh
set SLACK_TOKEN="your_token_here"
```

5️⃣ Execute o script:

```sh
python scripts/daily_slack.py
```

---

## 🔁 Opção 2: Google Apps Script + Slack Workflow + Webhook

Esta opção usa o Google Apps Script apenas para escolher o apresentador do dia e disparar um Webhook. A mensagem é montada e enviada pelo Slack Workflow Builder.

### 1️⃣ Criar o Workflow no Slack

1. Abra o **Workflow Builder** no Slack.
2. Crie um workflow a partir de um webhook:
   - Adicione o gatilho **Webhook**.
   - Crie uma variável de entrada chamada `presenter`.
   - Use essa variável na mensagem do workflow, por exemplo:

     ```text
     Hoje quem toca a daily é: <@presenter>!
     ```

   - Configure o canal e o texto da mensagem da daily.
3. Publique o workflow e copie a URL do webhook.

> A variável `presenter` recebe o ID do usuário no Slack, como `U0C73125WUT`. A menção deve ser feita no formato `<@presenter>` dentro da mensagem do Slack.

### 2️⃣ Configurar o Google Apps Script

1. Acesse o [Google Apps Script](https://script.google.com/) e crie um novo projeto.
2. Copie o conteúdo de [`scripts/daily_slack_bot.js`](scripts/daily_slack_bot.js) para o editor do Apps Script.
3. No Apps Script, abra **Configurações do projeto → Propriedades do script**.
4. Adicione a propriedade:

   | Propriedade | Valor |
   |-------------|-------|
   | `SLACK_WORKFLOW_URL` | URL do webhook gerado pelo Slack Workflow |

5. Atualize a lista `participants` com os IDs dos usuários do Slack:

   ```javascript
   const participants = ["U123456", "U654321", "U987654"];
   ```

6. Execute a função `configureTriggers` uma vez manualmente para autorizar o script e criar os acionadores.

Os acionadores são criados para segunda a sexta-feira, às 11h, no fuso `America/Sao_Paulo`. Antes de criar novos acionadores, a função remove os acionadores existentes associados a `drawPresenter`, evitando duplicidade.

### 3️⃣ Testar a integração

Para testar sem aguardar o horário agendado:

1. No editor do Apps Script, selecione a função `drawPresenter`.
2. Clique em **Executar**.
3. Confirme se o Slack Workflow foi acionado e se a mensagem foi publicada no canal configurado.

O Apps Script envia um payload semelhante a:

```json
{
  "presenter": "U123456"
}
```

> Não compartilhe a URL do Webhook. Se ela for exposta, gere uma nova URL no Slack Workflow e atualize a propriedade `SLACK_WORKFLOW_URL`.

---

## 📅 Agendamento via GitHub Actions

O GitHub Actions permite executar bots de forma automática e manual.

### 🔹 Execução automática

O bot pode ser agendado para ser executado em horários específicos usando tarefas cron no GitHub Actions.

#### Exemplo de configuração (`.github/workflows/ci.yaml`):

```yaml
name: Daily Slack Notification

on:
  schedule:
    - cron: "30 12 * * 1-5"  # Executa às 12h30 (UTC), de segunda a sexta-feira
  workflow_dispatch:  # Permite a execução manual pelo GitHub Actions

jobs:
  daily-slack-notification:
    name: Enviar notificação ao Slack
    runs-on: ubuntu-latest

    steps:
      - name: Fazer checkout do repositório
        uses: actions/checkout@v4

      - name: Configurar o Python
        uses: actions/setup-python@v4
        with:
          python-version: "3.9"

      - name: Instalar dependências
        run: pip install -r requirements.txt

      - name: Executar script Python
        run: python scripts/daily_slack.py
```

🔹 **Observação:** a tarefa cron pode ser ajustada para ser executada em diferentes horários e dias, conforme necessário.

---

## ✅ Testes e depuração

Se você precisar testar ou depurar o código:

1️⃣ Verifique se as variáveis de ambiente estão definidas corretamente.
2️⃣ Teste manualmente a API do Slack usando `requests.post`.
3️⃣ Use instruções `print()` no código para verificar os valores das variáveis antes de enviar a mensagem.

---

## 🚨 Solução de problemas

- **O bot não está enviando mensagens para o Slack**
  - Verifique se o `SLACK_TOKEN` está correto e ativo.
  - Certifique-se de que o bot está presente no canal correto (`#seu-canal`).

- **O bot não está sendo executado automaticamente**
  - Confirme se o GitHub Actions está habilitado no repositório.
  - Verifique o histórico do workflow em busca de possíveis erros.

---
