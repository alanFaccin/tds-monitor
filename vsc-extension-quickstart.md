# TOTVS Developer Studio Code

O plugin do TOTVS Developer Studio Code disponibiliza uma suíte de desenvolvimento para o ecossistema Protheus.
Ele utiliza os protocolos de comunicação LSP (Language Server Protocol) e DAP (Debug Adapter Protocol), ambos amplamente utilizados e extensíveis à outras IDEs de mercado, como Atom, Visual Studio, Eclipse, Eclipse Theia, Vim e Emacs.

> [Lista de IDEs com suporte ao LSP](https://microsoft.github.io/language-server-protocol/implementors/tools).
[Lista de IDEs com suporte ao DAP](https://microsoft.github.io/debug-adapter-protocol/implementors/tools).

## Funcionalidades

* Comunicação baseada nos protocolos LSP/DAP.
* Compilação de fontes, pastas e da área de trabalho.
* Depuração de fontes (Local e WebApp).
* Geração de Patch com seleção visual de arquivos.
* Aplicação de Patch.
* Deleção de fontes do RPO.
* Desfragmentação do RPO.

## Configurações Gerais

### Tela de boas vindas

* A tela da boa vindas permite configurar a localização do SmartClient e dos diretórios de Includes que serão utilizados durante a compilação dos códigos fontes.
* Esta tela será apresentada na primeira execução do plugin, assim que o primeiro fonte AdvPL for aberto.
* Localize o `SmartClient.exe` (Windows) ou `smartclient` (Linux).
* Localize os diretórios de Includes que necessitar para seus projetos.
* Pressione o botão `Salvar` para concluir.

![Welcome Screen](https://raw.githubusercontent.com/TOTVSTEC/tds-images/master/welcome_screen.gif)

> Você pode exibir novamente a tela de boas vindas acessando o atalho `CTRL + SHIFT + P` digitando `TOTVS: Welcome Page`.

### Cadastro de servidores utilizando o assistente

* Clique no icone `"+"` no canto superior direito da visão, ao lado da aba `Servidores`.
* Preencha as informações de `nome`, `ip` e `porta` do Servidor.
* Clique no botão `Salvar`.

![New server](https://raw.githubusercontent.com/TOTVSTEC/tds-images/master/new_server.gif)

### Conexão com servidores

* Após executar o cadastro de ao menos um servidor.
* Vá para visão de servidores (Acesso pelo ícone da TOTVS na lateral esquerda do VSCode).
* Clique com o botão direito e selecione a opção `Connect`.
* Informe `ambiente`, `usuário` e `senha` (pode ser "em branco") para prosseguir.
* Aguarde o termino da conexão.

## Configurações de Debug

### Criando manualmente uma configuração de debug

* O arquivo `launch.json` será criado automaticamente através da Tela de Boas Vindas.
* Caso haja problemas com este arquivo você pode criá-lo manualmente através dos seguintes passos:

  * Selecione a seção `Debug` no painel esquerdo do VSCode.
  * Selecione na parte superior desta tela a opção `Add Configuration...`.
  * Comece a digitar `TOTVS` e selecione o tipo desejado
    * Tipo: _totvs_language_debug_, usa o SmartClient Desktop.
      Preencha o arquivo `launch.json` de acordo com seu ambiente e necessidas, como no exemplo abaixo.

>``{``
"type": "totvs_language_debug",
"request": "launch",
"name": "Totvs Language Debug",
"program": "${command:AskForProgramName}",
"cwb": "${workspaceFolder}",
"smartclientBin": "/home/mansano/_c/totvs12/bin/smartclient/smartclient"
``}``

    * Tipo: _totvs_language_web_debug_, usa o SmartClient Html.
      Preencha o arquivo `launch.json` de acordo com seu ambiente e necessidas, como no exemplo abaixo..

>``{``
"type": "totvs_language_web_debug",
"request": "launch",
"name": "Totvs Language Debug",
"program": "${command:AskForProgramName}",
"cwb": "${workspaceFolder}",
"smartclientUrl": "<http://localhost:8080>"
``}``

*Nota:* Abra o arquivo `settings.json` e informe a chave "", com o caminho completo do seu navegador web.
>``{``
"totvsLanguageServer.welcomePage": false,
"totvsLanguageServer.web.navigator": "C:\\Program Files\\Mozilla Firefox\\firefox.exe"
``}``

### Criando uma configuração de debug com assistente

* Para abrir o assistente de nova configuração de debug, pressione o atalho `CTRL + SHIFT + P` e digite `TOTVS: Configure Launchers`.
* Será aberto um assistente de configuração de launcher que permite criar uma nova configuração ou editar uma configuração já existente.
* Preencha as informações e clique em `Save`.

### Iniciando um debug

* Caso necessário, verifique se os dados do arquivo `launch.json` estão corretos.
* Conecte-se a um servidor previamente cadastrado.
* Pressione o atalho `F5` para iniciar o debug.
* Caso necessário abrir o `launch.json` novamente, Selecione a seção `Debug` no painel esquerdo do VSCode
* E por fim no ícone de configuração na parte superior `Open launch.json`, representado pelo icone de uma `engrenagem`.
* Será exibido um campo para digitação do fonte que deseja depurar, ex: `u_teste`.
* Pressione `Enter` para iniciar a depuração.

### Gerando um Patch

* Para gerar um Patch conecte-se ao Servidor.
* Selecione com o botão direito do mouse o Servidor conectado.
* Selecione a opção `Patch: Generate`.
* Aguarde a carga dos arquivos do Inspetor de Objetos.
* Selecione os arquivos que desejar para o Patch utilizando o campo de `Filtro`.
* Para digitar o filtro simplesmente saia do campo ou pressione `Enter`.
* Selecione agora os arquivos na lista da esquerda e mova os desejados para lista da direita utilizando o botão `">>"`.
* Repita o processo até que tenha selecionado todos os arquivos necessários.
* Selecione agora o `diretório` onde deseja salvar o Patch.
* Escolha o `nome do arquivo` de Patch desejado.
* Efetue e geração do Patch pressionando o botão `Gerar`.

![Patch Generate](https://raw.githubusercontent.com/TOTVSTEC/tds-images/master/patch_generate.gif)

### Usando Debug Console

* É possível verificar os valores de variáveis e executar métodos durante o debug com o Debug Console.
* Coloque um breakpoint em um ponto necessário de seu fonte.
* Quando a depuração "parar" ao breakpoint, abra a visão `Debug Console` na parte inferior da tela.
* Digite uma operação ou variável AdvPL disponivel em seu ambiente de depuração.
* Analise os dados retornados de acordo com sua necessidade.

## Configurações de Compilação

### Compilando Function e Main Function

* Antigamente para ter permissões especiais de compilação era necessário possuir uma chave de compilação e agora temos um novo procedimento, mais seguro e simples.
* Agora, utilizamos a autenticação com o Identity para liberar essas permissões de compilação.
* Na visão de servidores, clique com o botão direito e selecione a opção `Login Identity`, ou com o atalho `CTRL + SHIFT + P` digitando `TOTVS: Login Identity`.
* Informe no usuário o seu email e a senha utilizada para login no Identity (mesmo usuário e senha utilizado no Gmail e Fluig).
* Com o sucesso na validação, aparecerá uma mensagem de usuário logado e ficará na barra de tarefas as informações do usuário que está autenticado e até quando a sessão é válida.
* Caso não tenha sucesso no login, verifique se seu email e senha estão corretos.

### Configuração de Include

* As configurações de include ficam no arquivo `.vscode/servers.json` na raiz do workspace aberto. Abra esse arquivo.
* Já existe por padrão o diretório `"C:/totvs/includes"`.
* Para adicionar uma nova configuração de include separe por vírgula ou substitua o path existente.
  Ex:`"includes": ["C:/totvs/includes1","C:/totvs/includes2", "C:/totvs/includes3"]`.
* Também é possível alterar a configuração de include pela página de boas vindas, acessando o atalho `CTRL + SHIFT + P` digitando `TOTVS: Welcome Page`.

### Arquivos do pré compilador

* Para manter os arquivos gerados pelo pré-compilador, habilite a opção nas preferencias em: `File | Preferences | Settings | Extensions | AdvPL | Leave PPO File`.
* Caso queira um log completo das operações efetuadas pelo pré-compilador, habilite a opção: `File | Preferences | Settings | Extensions | AdvPL | Show Pre Compiler`.

## Plugins recomendados

* Numbered Bookmarks.

  Permite uso de bookmarks no estilo Delphi numerados de 1 a 9.

  <https://marketplace.visualstudio.com/items?itemName=alefragnani.numbered-bookmarks>

  ![Toggle](https://github.com/alefragnani/vscode-numbered-bookmarks/raw/master/images/numbered-bookmarks-toggle.png)

## Problemas Conhecidos

* NT.

## Notas de Release

* 0.0.10

  * Liberação da ferramenta de geração de Patch visual.