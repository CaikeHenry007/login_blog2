const express = require('express');
const mysql = require('mysql2');
const session = require('express-session');
const bodyParser = require('body-parser');
const app = express();

// Configurar a conexão com o banco de dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'phpmyadmin',
    password: 'admin',
    database: 'mydb',
});

db.connect((err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err);
        throw err;
    }
    console.log('Conexão com o banco de dados MySQL estabelecida.');
});

// Configurar a sessão
app.use(
    session({
        secret: 'Escreva aqui a senha para criptografar as sessões.',
        resave: true,
        saveUninitialized: true,
    })
);

// Configuração de pastas com aquivos estáticos
//app.use('/img', express.static(__dirname + '/img'))
app.use('/static', express.static(__dirname + '/static'));

// Engine do Express para processar o EJS (templates)
// Lembre-se que para uso do EJS uma pasta (diretório) 'views', precisa existir na raiz do projeto.
// E que todos os EJS serão processados a partir desta pasta
app.use(bodyParser.urlencoded({ extended: true }));

// Configurar EJS como o motor de visualização
app.set('view engine', 'ejs');

// Configuração das rotas do servidor HTTP
// A lógica ddo processamento de cada rota deve ser realizada aqui
app.get('/', (req, res) => {
    // Passe a variável 'req' para o template e use-a nas páginas para renderizar partes do HTML conforme determinada condição
    // Por exemplo de o usuário estive logado, veja este exemplo no arquivo views/partials/header.ejs
    res.redirect('posts');
    // Caso haja necessidade coloque pontos de verificação para verificar pontos da sua logica de negócios
    console.log(`${req.session.username ? `Usuário ${req.session.username} logado no IP ${req.connection.remoteAddress}` : 'Usuário não logado.'}  `);
    //console.log(req.connection)
    ;
});

// Rota para a página de login
app.get('/login', (req, res) => {
    // Quando for renderizar páginas pelo EJS, passe parametros para ele em forma de JSON
    res.render('pages/login', { req: req });
});


app.get('/about', (req, res) => {
    res.render('pages/about', { req: req });
});

app.get('/posts', (req, res) => {

    const query = 'SELECT * FROM posts';

    db.query(query, [], (err, results) => {
        if (err) throw err;
        res.render('pages/pg_posts', { req: req, posts: results });

    });
});

app.get('/lista', (req, res) => {
    const autor = req.session.username; // Obtendo o nome de usuário da sessão
    if (!autor) {
        return res.redirect('/login'); // Redireciona para a página de login se o usuário não estiver autenticado
    }
    const query = 'SELECT * FROM posts';
    db.query(query, [], (err, results) => {
        if (err) throw err;

        res.render('pages/lista_posts', { req: req, posts: results });

    });
});

// Rota para deletar um post
app.get('/lista/:id', (req, res) => {
    const postId = req.params.id;
    db.query('DELETE FROM posts WHERE id = ?', postId, (error, results) => {
        if (error) throw error;
        res.redirect('/delete_ok');
    });
});

// Rota para deletar um post
app.post('/delete', (req, res) => {
  
    db.query('DELETE FROM posts', (error, results) => {
        if (error) throw error;
        res.redirect('/delete_ok');
    });
});



// Rota para processar o formulário de login
app.post('/login', (req, res) => {
    const { username, password } = req.body;

    const query = 'SELECT * FROM users WHERE username = ? AND password = SHA1(?)';

    db.query(query, [username, password], (err, results) => {
        if (err) throw err;

        if (results.length > 0) {
            req.session.loggedin = true;
            req.session.username = username;
            res.redirect('/');
        } else {
            // res.send('Credenciais incorretas. <a href="/">Tente novamente</a>');
            res.redirect('/login_failed');
        }
    });
});

// Rota para processar o formulário de cadastro depostagem
app.post('/cadastrar_posts', (req, res) => {
    const { titulo, conteudo } = req.body;
    const autor = req.session.username; // Obtendo o nome de usuário da sessão

    // Verificando se o usuário está autenticado
    if (!autor) {
        return res.redirect('/login'); // Redireciona para a página de login se o usuário não estiver autenticado
    }

    // Obtendo a data atual sem o horário
    const data_postagem = new Date().toISOString().split('T')[0];

    const query = 'INSERT INTO posts (titulo, conteudo, autor, data_postagem) VALUES (?, ?, ?, ?)';

    db.query(query, [titulo, conteudo, autor, data_postagem], (err, results) => {
        if (err) throw err;
        console.log(`Rotina cadastrar posts: ${JSON.stringify(results)}`);
        if (results.affectedRows > 0) {
            console.log('Cadastro de postagem OK')
            res.redirect('/post_ok');
        } else {
            res.redirect('/post_failed');
        }
    });
});

app.get('/editar/:id', (req, res) => {

    const postId = req.params.id;
    const query = 'SELECT * FROM posts WHERE id = ?'

    db.query(query, [postId], (err, results) => {
        if (err) throw err;

        res.render('pages/editar_posts', { req: req, posts: results[0] });
        console.log(JSON.stringify(results))
    });
});

app.post('/editar_posts/:id', (req, res) => {

    const postId = req.params.id; // Obtendo o ID do post a ser editado
    const { titulo, conteudo } = req.body;
    const autor = req.session.username; // Obtendo o nome de usuário da sessão
    const data_postagem = new Date().toISOString().split('T')[0];
    const query = 'UPDATE posts SET titulo = ?, conteudo = ?, data_postagem = ? WHERE id = ?';

    // Verificando se o usuário está autenticado
    if (!autor) {
        return res.redirect('/login'); // Redireciona para a página de login se o usuário não estiver autenticado
    }

    db.query(query, [titulo, conteudo, data_postagem, postId], (err, results) => {
        if (err) throw err;
        console.log(`Rotina editar posts: ${JSON.stringify(results)}`);

        return res.redirect('/'); // Redireciona para a página de login se o usuário não estiver autenticado
    });

});






// const query = 'INSERT INTO users (username, password) VALUES (?, SHA1(?))';
// console.log(//`POST /CADASTAR -> //query -> ${query}`);
// db.query(query, [username, password], (err, results) => {
//     console.log(results);
//     //console.log(`POST /CADASTAR -> results -> ${results}`);

//     if (err) {
//         console.log(`ERRO NO CADASTRO: ${err}`);
//         throw err;
//     }
//     if (results.affectedRows > 0) {
//         req.session.loggedin = true;
//         req.session.username = username;
//         res.redirect('/register_ok');
//     }
// });


// Rota para a página cadastro do post
app.get('/cadastrar_posts', (req, res) => {
    // Quando for renderizar páginas pelo EJS, passe parametros para ele em forma de JSON
    if (req.session.loggedin) {
        res.render('pages/cadastrar_posts', { req: req });
    } else {
        res.redirect('/login_failed');
    }
});

// Rotas para cadastrar
app.get('/cadastrar', (req, res) => {
    if (!req.session.loggedin) {
        res.render('pages/cadastrar', { req: req });
    } else {
        res.redirect('pages/dashboard', { req: req });
    }
});

// Rota para efetuar o cadastro de usuário no banco de dados
app.post('/cadastrar', (req, res) => {
    const { username, password } = req.body;

    // Verifica se o usuário já existe
    const query = 'SELECT * FROM users WHERE username = ? AND password = SHA1(?)';
    db.query(query, [username, password], (err, results) => {
        if (err) throw err;
        // Caso usuário já exista no banco de dados, redireciona para a página de cadastro inválido
        if (results.length > 0) {
            console.log(`Usuário ${username} já existe no banco de dados. redirecionando`);
            res.redirect('/register_failed');
        } else {
            // Cadastra o usuário caso não exista
            const query = 'INSERT INTO users (username, password) VALUES (?, SHA1(?))';
            console.log(`POST /CADASTAR -> query -> ${query}`);
            db.query(query, [username, password], (err, results) => {
                console.log(results);
                //console.log(`POST /CADASTAR -> results -> ${results}`);

                if (err) {
                    console.log(`ERRO NO CADASTRO: ${err}`);
                    throw err;
                }
                if (results.affectedRows > 0) {
                    req.session.loggedin = true;
                    req.session.username = username;
                    res.redirect('/register_ok');
                }
            });
        }
    });
});

app.get('/register_failed', (req, res) => {
    res.render('pages/register_failed', { req: req });
});

app.get('/delete_ok', (req, res) => {
    res.render('pages/delete_ok', { req: req });
});

app.get('/post_failed', (req, res) => {
    res.render('pages/post_failed', { req: req });
});

app.get('/post_ok', (req, res) => {
    res.render('pages/post_ok', { req: req });
});

app.get('/register_ok', (req, res) => {
    res.render('pages/register_ok', { req: req });
});

app.get('/login_failed', (req, res) => {
    res.render('pages/login_failed', { req: req });
});

// Rota para a página do painel
app.get('/dashboard', (req, res) => {
    //
    //modificação aqui
    if (req.session.loggedin) {
        //res.send(`Bem-vindo, ${req.session.username}!<br><a href="/logout">Sair</a>`);
        // res.sendFile(__dirname + '/index.html');
        res.render('pages/dashboard', { req: req });
    } else {
        res.redirect('/login_failed');
    }
});

// Rota para processar a saida (logout) do usuário
// Utilize-o para encerrar a sessão do usuário
// Dica 1: Coloque um link de 'SAIR' na sua aplicação web
// Dica 2: Você pode implementar um controle de tempo de sessão e encerrar a sessão do usuário caso este tempo passe.
app.get('/logout', (req, res) => {
    req.session.destroy(() => {
        res.redirect('/');
    });
});

// Rota de teste
app.get('/teste', (req, res) => {
    res.render('pages/teste', { req: req });
});


app.listen(3000, () => {
    console.log('----Login (MySQL version)-----')
    console.log('Servidor rodando na porta 3000');
});
