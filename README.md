# TOTVS Developer Studio Monitor

O plugin do TOTVS Developer Studio Monitor disponibiliza as funcionalidades do antigo Totvs Monitor dentro do VScode.
Ele utiliza os protocolos de comunicação LSP (Language Server Protocol) que é extensível à outras IDEs de mercado, como Atom, Visual Studio, Eclipse, Eclipse Theia, Vim e Emacs.

> [Lista de IDEs com suporte ao LSP](https://microsoft.github.io/language-server-protocol/implementors/tools).
[Lista de IDEs com suporte ao DAP](https://microsoft.github.io/debug-adapter-protocol/implementors/tools).

## Funcionalidades

* Adicionar Servidor.
* Conectar a um servidor.
* Desconectar de um servidor.
* Listar usuarios conectados.
* Apresentar informações da conexão em uma View HTML. (Em desenvolvimento)
* etc (Lista de funcionalidades do Totvs Monitor)

## Configurações Gerais

### Tela de boas vindas

### Cadastro de servidores utilizando o assistente

* Clique no icone `"+"` no canto superior direito da visão, ao lado da aba `Servidores`.
* Preencha as informações de `nome`, `ip` e `porta` do Servidor.
* Clique no botão `Salvar`.

### Conexão com servidores

* Após executar o cadastro de ao menos um servidor.
* Vá para visão de monitores (Acesso pelo ícone da TOTVS na lateral esquerda do VSCode).
* Clique com o botão direito e selecione a opção `Connect`.
* Informe `ambiente`, `usuário` e `senha` (pode ser "em branco") para prosseguir.
* Aguarde o termino da conexão.

## Problemas Conhecidos

* NT.

## Notas de Release

* 0.0.1

  * ---.