# AssetManager

Frontend do sistema de gerenciamento de ativos.

## Requisitos

- Node.js (versão 14 ou superior)
- npm
- nodemon (para desenvolvimento)

## Instalação

1. Clone o repositório
2. Instale as dependências:
```bash
npm install
```

## Configuração

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
BACKEND_URL=http://seu-backend:porta
```

## Executando o projeto

Para iniciar o servidor em modo de desenvolvimento:
```bash
npm run dev
```

Para iniciar o servidor em modo de produção:
```bash
npm start
```

O frontend estará disponível em `http://localhost:3000`

## Arquitetura

Este é o frontend do AssetManager, que se conecta a um backend remoto para todas as operações. O frontend é responsável por:

- Interface do usuário
- Gerenciamento de sessão
- Visualização de assets
- Player de vídeo (suporte a HLS e MP4)

## Autenticação

A autenticação é feita através do backend remoto:

1. O usuário fornece credenciais (email/senha)
2. O backend valida e retorna um token JWT
3. O frontend armazena o token em cookie
4. Todas as requisições subsequentes incluem o token

## Funcionalidades

### Gerenciamento de Clientes
- Seleção de cliente
- Visualização de canais por cliente
- Filtros específicos por cliente

### Visualização de Assets
- Lista de assets em modo grade ou lista
- Preview de vídeo (HLS/MP4)
- Detalhes técnicos
- Metadados
- Status do asset

### Filtros e Busca
- Busca por texto
- Filtros por tipo de mídia
- Filtros por status
- Paginação de resultados

## Estrutura de Arquivos

```
├── views/             # Templates EJS
│   └── main.ejs      # Template principal
├── public/           # Arquivos estáticos
│   ├── css/         # Estilos
│   └── js/          # Scripts do cliente
├── index.js         # Servidor frontend
└── .env            # Configurações de ambiente
```

## Integração com Backend

O frontend se integra com dois tipos de sistemas:

1. Cloudport
   - Assets são servidos através do backend
   - Requer token de autenticação em todas as requisições
   - Streaming de vídeo via HLS

2. C3PO
   - Assets são servidos diretamente
   - URLs de vídeo são acessadas diretamente
   - Suporte a MP4 e outros formatos

## Segurança

- Autenticação via JWT
- Tokens armazenados em cookies HTTP-only
- Todas as requisições para o backend incluem token de autenticação
- Suporte a CORS para integração segura com backend

## Desenvolvimento

Para desenvolvimento local:

1. Configure o arquivo `.env` com a URL do backend
2. Inicie o servidor com `npm run dev`
3. O nodemon reiniciará o servidor automaticamente quando houver alterações

## Troubleshooting

### Problemas comuns:

1. Erro de CORS
   - Verifique se o backend está configurado para aceitar requisições do frontend

2. Erro de autenticação
   - Verifique se o token está sendo enviado corretamente
   - Verifique se o token não expirou

3. Problemas com vídeo
   - Verifique o console do navegador para erros
   - Confirme se a URL do vídeo está correta para o tipo de sistema (Cloudport/C3PO)