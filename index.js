require('dotenv').config();
const express = require('express');
const axios = require('axios');
const jwt = require('jsonwebtoken');
const fs = require('fs').promises;
const path = require('path');
const cookieParser = require('cookie-parser');
const app = express();
const port = 3002;

// Configuração do EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Configuração de arquivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Middleware para injetar variáveis de ambiente no frontend
app.use((req, res, next) => {
  res.locals.BACKEND_URL = process.env.BACKEND_URL;
  next();
});

// Middleware para verificar se as variáveis de ambiente estão configuradas
const checkConfig = (req, res, next) => {
  if (!process.env.PLAYOUT_URL || !process.env.PLAYOUT_TOKEN) {
    return res.status(500).json({
      error: 'Configuração incompleta. Verifique as variáveis de ambiente PLAYOUT_URL e PLAYOUT_TOKEN.'
    });
  }
  next();
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) return res.redirect('/login');

  // Não precisamos mais verificar o token localmente
  // Apenas passamos para o próximo middleware
  req.user = { token }; // Mantemos o token para uso posterior
  next();
};

// Rota de login
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Processamento do login
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Faz a requisição de login para o backend remoto
    const response = await axios.post(`${process.env.BACKEND_URL}/user/login`, {
      email,
      password
    });

    // Se não recebeu o token do backend
    if (!response.data.token) {
      return res.render('login', { error: 'Credenciais inválidas' });
    }

    // Usa o token recebido do backend remoto
    const token = response.data.token;
    const name = response.data.name;

    res.cookie('token', token, {
      httpOnly: true,
      secure: false,
      maxAge: 28800000 // 1 hora
    });

    res.cookie('name', name, {
      httpOnly: true,
      secure: false,
      maxAge: 28800000 // 1 hora
    });

    res.redirect('/main');
  } catch (error) {
    console.error('Erro no login:', error);
    res.render('login', { error: 'Erro ao processar login' });
  }
});

// Rota de logout
app.get('/logout', (req, res) => {
  res.clearCookie('token');
  res.redirect('/login');
});

// Rota para obter informações de clientes específicos
app.get('/customers', async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({ error: 'O parâmetro customer_id é obrigatório.' });
  }

  try {
    const data = await fs.readFile('customers.json', 'utf8');
    const customers = JSON.parse(data);

    // Converte os IDs recebidos em um array
    const ids = customer_id.split(',').map(id => parseInt(id.trim()));

    // Filtra os clientes com base nos IDs fornecidos
    const filteredCustomers = customers.filter(c => ids.includes(c.customer_id));

    if (filteredCustomers.length === 0) {
      return res.status(404).json({ error: 'Nenhum cliente encontrado para os IDs fornecidos.' });
    }

    // Mapeia para retornar apenas as informações necessárias
    const responseCustomers = filteredCustomers.map(c => ({
      customer_id: c.customer_id,
      customer_name: c.customer_name,
      playout_url: c.system_info.playout_url, // Incluindo para uso posterior
      playout_token: c.system_info.playout_token // Incluindo para uso posterior
    }));

    res.json(responseCustomers);
  } catch (error) {
    console.error('Erro ao ler o arquivo customers.json:', error);
    res.status(500).json({ error: 'Erro ao processar a solicitação.' });
  }
});

// Rota principal
app.get('/main', authenticateToken, async (req, res) => {
  try {
    // Obter lista de clientes usando o token do backend
    const customersResponse = await axios.get(`${process.env.BACKEND_URL}/api/customers`, {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`
      }
    });

    const customerInfo = customersResponse.data.map(c => ({
      customer_id: c._id,
      customer_name: c.customer_name
    }));

    // Obter feeds do cliente selecionado
    const firstCustomer = customerInfo[0];
    const feedsResponse = await axios.get(`${process.env.BACKEND_URL}/api/customers?customer_id=${firstCustomer.customer_id}`, {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`
      }
    });

    res.render('main', {
      user: {
        token: req.cookies.token,
        name: req.cookies.name
      },
      customer: customerInfo,
      channels: feedsResponse.data,
      token: req.cookies.token // Passando o token do backend remoto
    });
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (error.response && error.response.status === 401) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    res.render('main', {
      user: {
        token: req.cookies.token,
        name: null
      },
      customer: null,
      channels: [],
      token: req.cookies.token
    });
  }
});

// Rota principal
app.get('/multiview', authenticateToken, async (req, res) => {
  try {
    // Obter lista de clientes usando o token do backend

    res.render('multiview', {
      user: {
        token: req.cookies.token,
        name: req.cookies.name
      },
      token: req.cookies.token // Passando o token do backend remoto
    });
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (error.response && error.response.status === 401) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    res.render('multiview', {
      user: {
        token: req.cookies.token,
        name: null
      },
      customer: null,
      token: req.cookies.token
    });
  }
});

app.get('/multiview/all', authenticateToken, async (req, res) => {
  try {
    // Obter lista de clientes usando o token do backend

    res.render('multiviewAll', {
      user: {
        token: req.cookies.token,
        name: req.cookies.name
      },
      token: req.cookies.token // Passando o token do backend remoto
    });
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (error.response && error.response.status === 401) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    res.render('multiviewAll', {
      user: {
        token: req.cookies.token,
        name: null
      },
      customer: null,
      token: req.cookies.token
    });
  }
});

app.get('/schedule', authenticateToken, async (req, res) => {
  try {
    // Obter lista de clientes usando o token do backend
    const customersResponse = await axios.get(`${process.env.BACKEND_URL}/api/customers`, {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`
      }
    });

    const customerInfo = customersResponse.data.map(c => ({
      customer_id: c._id,
      customer_name: c.customer_name
    }));

    // Obter feeds do cliente selecionado
    const firstCustomer = customerInfo[0];
    const feedsResponse = await axios.get(`${process.env.BACKEND_URL}/api/customers?customer_id=${firstCustomer.customer_id}`, {
      headers: {
        'Authorization': `Bearer ${req.cookies.token}`
      }
    });

    res.render('schedule', {
      user: {
        token: req.cookies.token,
        name: req.cookies.name
      },
      customer: customerInfo,
      channels: feedsResponse.data,
      token: req.cookies.token // Passando o token do backend remoto
    });
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (error.response && error.response.status === 401) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    res.render('schedule', {
      user: {
        token: req.cookies.token,
        name: null
      },
      customer: null,
      channels: [],
      token: req.cookies.token
    });
  }
});

app.get('/config', authenticateToken, async (req, res) => {
  try {
    // Obter lista de clientes usando o token do backend

    res.render('config', {
      user: {
        token: req.cookies.token,
        name: req.cookies.name
      },
      token: req.cookies.token // Passando o token do backend remoto
    });
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (error.response && error.response.status === 401) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    res.render('config', {
      user: {
        token: req.cookies.token,
        name: null
      },
      customer: null,
      token: req.cookies.token
    });
  }
});

app.get('/dashboard', authenticateToken, async (req, res) => {
  try {
    res.render('monitorView', { videoUrl: monitorConfig[0] || '', user: { token: req.cookies.token, name: req.cookies.name }, token: req.cookies.token });
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (error.response && error.response.status === 401) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    res.render('monitorView', { videoUrl: '', user: { token: req.cookies.token, name: null }, token: req.cookies.token });
  }
});
app.get('/now_playing', async (req, res) => {
  const { customer_id } = req.query;
      res.render('monitorView', { videoUrl: monitorConfig[3] || '', user: { token: req.cookies.token, name: req.cookies.name }, token: req.cookies.token });

  if (!customer_id) {
    return res.status(400).json({ error: 'O parâmetro customer_id é obrigatório.' });
  }

  try {
    // Consulta o endpoint /customers para obter as informações do cliente
    const customerResponse = await axios.get(`${process.env.BASE_URL}/customers?customer_id=${customer_id}`);
    const customer = customerResponse.data[0]; // Pegando o primeiro cliente da resposta
    console.log(customer);

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Faz a requisição para obter os feeds em reprodução
    const response = await axios.get(`${customer.playout_url}/v1/api/feeds/now_playing_user_feeds`, {
      params: {
        token: customer.playout_token
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao consultar feeds em reprodução:', error.message);
    res.status(500).json({
      error: 'Erro ao consultar feeds em reprodução no CloudPort',
      details: error.message
    });
  }
});

app.get('/monitor-config', authenticateToken, async (req, res) => {
  try {
    // Obtenha lista de clientes e canais como nas outras rotas
    const customersResponse = await axios.get(`${process.env.BACKEND_URL}/api/customers`, {
      headers: { 'Authorization': `Bearer ${req.cookies.token}` }
    });
    const customerInfo = customersResponse.data.map(c => ({
      customer_id: c._id,
      customer_name: c.customer_name
    }));
    // Pegue canais do primeiro cliente (ou todos)
    const feedsResponse = await axios.get(`${process.env.BACKEND_URL}/api/customers?customer_id=${customerInfo[0].customer_id}`, {
      headers: { 'Authorization': `Bearer ${req.cookies.token}` }
    });
    res.render('monitorConfig', {
      user: { token: req.cookies.token, name: req.cookies.name },
      customer: customerInfo,
      channels: feedsResponse.data,
      token: req.cookies.token
    });
  } catch (error) {
    res.render('monitorConfig', { user: { token: req.cookies.token, name: null }, customer: null, channels: [], token: req.cookies.token });
  }
});

let monitorConfig = [];

app.post('/set-monitors', express.json(), authenticateToken, (req, res) => {
  const userPermittedChannels = getUserPermittedChannels(req.user);
  const requestedChannels = req.body.monitors;
  const allValid = requestedChannels.every(url =>
    userPermittedChannels.some(channel => channel.detail.live_url === url)
  );
  if (!allValid) {
    return res.status(403).json({ error: 'Canal não permitido para este usuário.' });
  }
  monitorConfig = requestedChannels;
  res.json({ success: true });
});

app.get('/monitor', authenticateToken, (req, res) => {
  try {

    res.render('multiviewAll', {
      user: {
        token: req.cookies.token,
        name: req.cookies.name
      },
      token: req.cookies.token // Passando o token do backend remoto
    });
  } catch (error) {
    console.error('Erro ao carregar dados:', error);
    if (error.response && error.response.status === 401) {
      res.clearCookie('token');
      return res.redirect('/login');
    }
    res.render('multiviewAll', {
      user: {
        token: req.cookies.token,
        name: null
      },
      customer: null,
      token: req.cookies.token
    });
  }
});


// Endpoint para consultar feeds
//app.get('/feeds', authenticateToken, checkConfig, async (req, res) => {
//  try {
//    const response = await axios.get(`${process.env.PLAYOUT_URL}/v1/api/feeds.json`, {
//      params: {
//        token: process.env.PLAYOUT_TOKEN
//      }
//    });
//    res.json(response.data);
//  } catch (error) {
//    console.error('Erro ao consultar feeds:', error.message);
//    res.status(500).json({
//      error: 'Erro ao consultar feeds do CloudPort',
//      details: error.message
//    });
//  }
//});

// Endpoint para consultar mídias
app.get('/media', authenticateToken, checkConfig, async (req, res) => {
  try {
    const { feed_id, category = 'media', limit = 20, offset = 0 } = req.query;

    if (!feed_id) {
      return res.status(400).json({
        error: 'O parâmetro feed_id é obrigatório'
      });
    }

    const response = await axios.get(`${process.env.PLAYOUT_URL}/v1/api/media.json`, {
      params: {
        token: process.env.PLAYOUT_TOKEN,
        feed_id,
        get_max_duration: true,
        category,
        limit,
        offset
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao consultar mídias:', error.message);
    res.status(500).json({
      error: 'Erro ao consultar mídias do CloudPort',
      details: error.message
    });
  }
});

// Endpoint para buscar mídias
app.get('/search', authenticateToken, checkConfig, async (req, res) => {
  try {
    const { feed_id, type = '', search = '', limit = 20, offset = 0, state = '', customer_id } = req.query;

    if (!feed_id) {
      return res.status(400).json({
        error: 'O parâmetro feed_id é obrigatório'
      });
    }

    // Verifica se o customer_id foi fornecido
    if (!customer_id) {
      return res.status(400).json({
        error: 'O parâmetro customer_id é obrigatório'
      });
    }

    // Consulta o endpoint /customers para obter as informações do cliente
    const customerResponse = await axios.get(`${process.env.BASE_URL}/customers?customer_id=${customer_id}`);
    const customer = customerResponse.data[0]; // Pegando o primeiro cliente da resposta

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Faz a requisição para buscar mídias
    const response = await axios.get(`${customer.playout_url}/v1/api/media.json`, {
      params: {
        token: customer.playout_token,
        feed_id,
        type,
        search,
        limit,
        offset,
        state
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao buscar mídias:', error.message);
    res.status(500).json({
      error: 'Erro ao buscar mídias no CloudPort',
      details: error.message
    });
  }
});

// Endpoint para consultar feeds em reprodução
app.get('/now_playing', async (req, res) => {
  const { customer_id } = req.query;

  if (!customer_id) {
    return res.status(400).json({ error: 'O parâmetro customer_id é obrigatório.' });
  }

  try {
    // Consulta o endpoint /customers para obter as informações do cliente
    const customerResponse = await axios.get(`${process.env.BASE_URL}/customers?customer_id=${customer_id}`);
    const customer = customerResponse.data[0]; // Pegando o primeiro cliente da resposta
    console.log(customer);

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Faz a requisição para obter os feeds em reprodução
    const response = await axios.get(`${customer.playout_url}/v1/api/feeds/now_playing_user_feeds`, {
      params: {
        token: customer.playout_token
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error('Erro ao consultar feeds em reprodução:', error.message);
    res.status(500).json({
      error: 'Erro ao consultar feeds em reprodução no CloudPort',
      details: error.message
    });
  }
});

// Endpoint para consultar tipos de mídia
app.get('/media/types', checkConfig, async (req, res) => {
  try {
    const { feed_id, customer_id } = req.query;

    if (!feed_id) {
      return res.status(400).json({
        error: 'O parâmetro feed_id é obrigatório'
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        error: 'O parâmetro customer_id é obrigatório'
      });
    }

    // Consulta o endpoint /customers para obter as informações do cliente
    const customerResponse = await axios.get(`${process.env.BASE_URL}/customers?customer_id=${customer_id}`);
    const customer = customerResponse.data[0]; // Pegando o primeiro cliente da resposta

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Faz a requisição para obter os tipos de mídia
    const response = await axios.get(`${customer.playout_url}/v1/api/media/types.json`, {
      params: {
        token: customer.playout_token,
        feed_id
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao consultar tipos de mídia:', error.message);
    res.status(500).json({
      error: 'Erro ao consultar tipos de mídia do CloudPort',
      details: error.message
    });
  }
});

// Endpoint para consultar quantidade de mídias
app.get('/media/count', checkConfig, async (req, res) => {
  try {
    const { feed_id, customer_id, category = 'media' } = req.query;

    if (!feed_id) {
      return res.status(400).json({
        error: 'O parâmetro feed_id é obrigatório'
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        error: 'O parâmetro customer_id é obrigatório'
      });
    }

    // Consulta o endpoint /customers para obter as informações do cliente
    const customerResponse = await axios.get(`${process.env.BASE_URL}/customers?customer_id=${customer_id}`);
    const customer = customerResponse.data[0]; // Pegando o primeiro cliente da resposta

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    // Faz a requisição para contar as mídias
    const response = await axios.get(`${customer.playout_url}/v1/api/media/count.json`, {
      params: {
        token: customer.playout_token,
        feed_id,
        category
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Erro ao consultar quantidade de mídia:', error.message);
    res.status(500).json({
      error: 'Erro ao consultar quantidade de mídia do CloudPort',
      details: error.message
    });
  }
});

// Endpoint para consultar medias com asset_id
app.get('/media/id', checkConfig, async (req, res) => {
  try {
    const { feed_id, id = '', customer_id } = req.query;

    if (!feed_id) {
      return res.status(400).json({
        error: 'O parâmetro feed_id é obrigatório'
      });
    }

    if (!customer_id) {
      return res.status(400).json({
        error: 'O parâmetro customer_id é obrigatório'
      });
    }

    // Consulta o endpoint /customers para obter as informações do cliente
    const customerResponse = await axios.get(`${process.env.BASE_URL}/customers?customer_id=${customer_id}`);
    const customer = customerResponse.data[0]; // Pegando o primeiro cliente da resposta

    if (!customer) {
      return res.status(404).json({ error: 'Cliente não encontrado.' });
    }

    const response = await axios.get(`${customer.playout_url}/v1/api/media/${id}.json`, {
      params: {
        token: customer.playout_token,
        feed_id,
      }
    });

    // Adiciona o playout_url e playout_token à resposta
    const responseData = {
      ...response.data,
      playout_url: customer.playout_url,
      playout_token: customer.playout_token
    };

    res.json(responseData);
  } catch (error) {
    console.error('Erro ao consultar informações da mídia:', error.message);
    res.status(500).json({
      error: 'Erro ao consultar informações da mídia do CloudPort',
      details: error.message
    });
  }
});

// Rota raiz redireciona para login
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.listen(port, () => {
  console.log(`Servidor frontend rodando em http://localhost:${port}`);
});
