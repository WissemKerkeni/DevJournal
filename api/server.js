const fs = require('fs')
const bodyParser = require('body-parser')
const jsonServer = require('json-server')
const jwt = require('jsonwebtoken')

const http = require('http');
const server = jsonServer.create()
const router = jsonServer.router('./database.json')
const userdb = JSON.parse(fs.readFileSync('./users.json', 'UTF-8'))

server.use(bodyParser.urlencoded({ extended: true }))
server.use(bodyParser.json())
server.use(jsonServer.defaults());

const SECRET_KEY = '123456789'

const expiresIn = '1h'
const image = username => `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random&size=128`
const bio = "I am a new hire at the company INFOR"
const following = false

 
/**
 * Creates a JSON Web Token (JWT) with the given payload.
 *
 * @param {Object} payload - The payload to be included in the token.
 * @returns {string} The generated JWT.
 */
function createToken(payload) {
  return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

/**
 * Verifies the given token using the SECRET_KEY.
 * @param {string} token - The token to be verified.
 * @returns {object|string} - The decoded token if verification is successful, otherwise an error message.
 */
function verifyToken(token) {
  return jwt.verify(token, SECRET_KEY, (err, decode) => decode !== undefined ? decode : err)
}

/**
 * Checks if a user is authenticated.
 * @param {Object} credentials - The user's credentials.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's password.
 * @returns {boolean} - Returns true if the user is authenticated, false otherwise.
 */
function isAuthenticated({ email, password }) {
  return userdb.users.some(user => user.email === email && user.password === password)
}


/**
 * Retrieves a user from the user database based on the provided email and password.
 * @param {Object} credentials - The user's email and password.
 * @param {string} credentials.email - The user's email.
 * @param {string} credentials.password - The user's password.
 * @returns {Object|undefined} The user object if found, otherwise undefined.
 */
function getUser({ email, password }) {
  return userdb.users.find(user => user.email === email && user.password === password)
}


server.post('/users', (req, res) => {
  console.log("register endpoint called; request body:");
  console.log(req.body);
  const { email, password, username } = req.body.user;

  if (isAuthenticated({ email, password })) {
    const status = 401;
    const message = 'Email and Password already exist';
    res.status(status).json({ status, message });
    return
  }

  fs.readFile("./users.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };

    // Get current users data
    var data = JSON.parse(data.toString());

    // Get the id of last user
    var last_item_id = data.users[data.users.length - 1].id;

    //Add new user
    data.users.push({ id: last_item_id + 1, email: email, password: password, username, image: image(username), bio }); //add some data
    var writeData = fs.writeFile("./users.json", JSON.stringify(data), (err, result) => {  // WRITE
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      }
    });
  });

  // Create token for new user
  const access_token = createToken({ email, password })
  console.log("Access Token:" + access_token);
  res.status(200).json({ user: { token: access_token, email, password, username, image: image(username), bio } })
})

// Login to one of the users from ./users.json
server.post('/users/login', (req, res) => {
  console.log("login endpoint called; request body:");
  console.log(req.body);
  const { email, password } = req.body.user;
  console.log(email + " " + password);
  const user = isAuthenticated({ email, password })
  if (!user) {
    const status = 401
    const message = 'Incorrect email or password'
    res.status(status).json({ status, errors: [message] })
    return
  }
  const access_token = createToken({ email, password })
  console.log("Access Token:" + access_token);
  res.status(200).json({ user: { token: access_token, email, password, username: getUser({ email, password })?.username } })
})

server.use(/^(?!\/(auth|socket\.io)).*$/, (req, res, next) => {
  if (req.headers.authorization === undefined || req.headers.authorization.split(' ')[0] !== 'Bearer') {
    const status = 401
    const message = 'Error in authorization format'
    res.status(status).json({ status, message })
    return
  }
  try {
    let verifyTokenResult;
    verifyTokenResult = verifyToken(req.headers.authorization.split(' ')[1]);

    if (verifyTokenResult instanceof Error) {
      const status = 401
      const message = 'Access token not provided'
      res.status(status).json({ status, message })
      return
    }
    next()
  } catch (err) {
    const status = 401
    const message = 'Error access_token is revoked'
    res.status(status).json({ status, message })
  }
})


// get /user from token
server.get('/user', (req, res) => {
  // get token from header
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    res.status(200).json({ user: { email: user.email, username: user.username, token, id: user.id, image: user.image } })
    return
  }
  res.status(404).json({ status: 404, message: 'User not found' })
})

// update user
server.put('/user', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    user.username = req.body.user.username;
    user.image = req.body.user.image || user.image;
    user.bio = req.body.user.bio;
    res.status(200).json({ user: { email: user.email, username: user.username, bio: user.bio, image: user.image, token, email: user.email, id: user.id } })
    return
  }
  res.status(404).json({ status: 404, message: 'User not found' })
})


server.get('/profiles/:username', (req, res) => {
  const user = userdb.users.find(user => user.username === req.params.username)
  if (user) {
    res.status(200).json({ profile: { username: user.username, bio: user.bio, image: user.image, following: user.following, following } })
    return
  }
  res.status(404).json({ status: 404, message: 'User not found' })
})


server.get('/profiles/:username/follow', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  const followedUser = userdb.users.find(user => user.username === req.params.username)
  user.following = true;
  followedUser.following = true;
  return res.status(200).json({ profile: { username: followedUser.username, bio: followedUser.bio, image: followedUser.image, following: followedUser.following, following } })
}
)


// post article
server.post('/articles', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    const { title, description, body, tagList } = req.body.article;

    console.log("tagList: " + tagList)
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };

      // Get current articles data
      var data = JSON.parse(data.toString());

      // Get the id of last article
      var last_item_id = data.articles.articles[data.articles.articles.length - 1].id;

      //Add new article
      data.articles.articles.unshift({
        id: last_item_id + 1,
        slug: title,
        title, description,
        body,
        tagList: tagList ? tagList : undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        favorited: false,
        favoritesCount: 0,
        comment:[],
        author: { username: user.username, bio: user.bio, image: user.image, following: user.following }
      }); //add some data
      data.tags.tags = [...new Set([...data.tags.tags, tagList || []])];
      var writeData = fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({ status, message })
          return
        }
      });
    });
    res.status(200).json(
      {
        article:
        {
          title,
          description,
          body,
          tagList,
          slug: title,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          favorited: false,
          favoritesCount: 0,
          author:
            { username: user.username, bio: user.bio, image: user.image, following: user.following }
        }
      })
    return
  }
  res.status(404).json({ status: 404, message: 'User not found' })
})

//delete article
server.delete('/articles/:slug', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };
      var data = JSON.parse(data.toString());
      data.articles.articles = data.articles.articles.filter(article => article.slug !== req.params.slug);
      data.tags.tags = [...new Set([...data.tags.tags])];
      fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({ status, message })
          return
        }
      });
      return res.status(204)
    });
  } else {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
})

//get articles by limit and ofset ?limit=10&offset=10
// ad params limit and offset
server.get('/articles', (req, res) => {
  const limit = +req.query.limit || 10;
  const offset = +req.query.offset || 0;// 0 or 10 or 20 ...
  const author = req.query.author;
  const favorited = req.query.favorited;
  const tag = req.query.tag;

  fs.readFile("./database.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };
    var data = JSON.parse(data.toString());
    if (author) {
      const articles = data.articles.articles.filter(article => article.author.username === author);
      const filteredArticle = articles.slice(offset, offset + limit);
      return res.status(200).json({ articles: filteredArticle, articlesCount: articles.length });
    }
    if (favorited) {
      const articles = data.articles.articles.filter(article => article.favorited)
      const filteredArticle = articles.slice(offset, offset + limit);
      return res.status(200).json({ articles: filteredArticle, articlesCount: articles.length });
    }
    if (tag) {
      const articles = data.articles.articles.filter(article => article.tagList.includes(tag))
      const filteredArticle = articles.slice(offset, offset + limit);
      return res.status(200).json({ articles: filteredArticle, articlesCount: articles.length });
    }
    const articles = data.articles.articles.slice(offset, offset + limit);
    return res.status(200).json({ articles, articlesCount: data.articles.articles.length });
  });

}
)

//search article by title
server.get('/articles/search', (req, res) => {
  const title = req.query.title;
  const limit = +req.query.limit || 10;
  const offset = +req.query.offset || 0;// 0 or 10 or 20 ...
  fs.readFile("./database.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };
    var data = JSON.parse(data.toString());
    const articles = data.articles.articles.filter(article => article.title.toLowerCase().includes(title.toLowerCase()));
    const filteredArticle = articles.slice(offset, offset + limit);
    return res.status(200).json({ articles: filteredArticle, articlesCount: articles.length });
  });
}
)


// get article by slig 
server.get('/articles/:slug', (req, res) => {
  fs.readFile("./database.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };
    var data = JSON.parse(data.toString());
    const article = data.articles.articles.find(article => article.slug === req.params.slug);
    if (article) {
      return res.status(200).json({ article });
    }
    return res.status(404).json({ status: 404, message: 'Article not found' });
  });
}
)



// get comments by article slug
server.get('/articles/:slug/comments', (req, res) => {
  fs.readFile("./database.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };
    var data = JSON.parse(data.toString());
    const article = data.articles.articles.find(article => article.slug === req.params.slug);
    if (article) {
      return res.status(200).json({ comments: article.comment });
    }
    return res.status(404).json({ status: 404, message: 'Article not found' });
  });
}
)

// add comment
server.post('/articles/:slug/comments', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };
      var data = JSON.parse(data.toString());
      const article = data.articles.articles.find(article => article.slug === req.params.slug);
      if (article) {
        const newComment = { id: Math.random().toString(36).substr(2, 9), createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), body: req.body.comment.body, author: { username: user.username, bio: user.bio, image: user.image, following: user.following } };
        article?.comment?.push(newComment);
        data.tags.tags = [...new Set([...data.tags.tags])];
        fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {  // WRITE
          if (err) {
            const status = 401
            const message = err
            res.status(status).json({ status, message })
            return
          }
        }
        );
        return res.status(200).json({ comment: ({ ...newComment, author: user, username: user.username, image: user.image }) });
      }
      return res.status(404).json({ status: 404, message: 'Article not found' });
    });
  } else {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
})

// update article by slug
server.put('/articles/:slug', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };
      var data = JSON.parse(data.toString());
      const article = data.articles.articles.find(article => article.slug === req.params.slug);
      if (article) {
        article.title = req.body.article.title;
        article.description = req.body.article.description;
        article.body = req.body.article.body;
        article.tagList = req.body.article.tagList;
        article.updatedAt = new Date().toISOString();
        data.tags.tags = [...new Set([...data.tags.tags, article.tagList])];
        fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {  // WRITE
          if (err) {
            const status = 401
            const message = err
            res.status(status).json({ status, message })
            return
          }
        }
        );
        return res.status(200).json({ article });
      }
      return res.status(404).json({ status: 404, message: 'Article not found' });
    });
  } else {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
})


//delete comment
// delete comment
server.delete('/articles/:slug/comments/:commentId', (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };
      var data = JSON.parse(data.toString());
      const article = data.articles.articles.find(article => article.slug === req.params.slug);
      if (article) {
        article.comment = article.comment.filter(comment => comment.id !== req.params.commentId);
        data.tags.tags = [...new Set([...data.tags.tags])];
        fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {
          if (err) {
            const status = 401
            const message = err
            res.status(status).json({ status, message })
            return
          }
        });
        return res.status(200).json({ message: 'Comment deleted successfully' });
      }
      return res.status(404).json({ status: 404, message: 'Article not found' });
    });
  } else {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
})

// add favorite
// articles/Ill-quantify-the-redundant-TCP-bus-that-should-hard-drive-the-ADP-bandwidth!-553/favorite
//return articles

server.post("/articles/:slug/favorite", (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };
      var data = JSON.parse(data.toString());
      const article = data.articles.articles.find(article => article.slug === req.params.slug);
      if (article) {
        article.favorited = true;
        article.favoritesCount++;
        data.tags.tags = [...new Set([...data.tags.tags])];
        fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {  // WRITE
          if (err) {
            const status = 401
            const message = err
            res.status(status).json({ status, message })
            return
          }
        }
        );
        return res.status(200).json({ article });
      }
      return res.status(404).json({ status: 404, message: 'Article not found' });
    });
  } else {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
})

// delete favorite
server.delete("/articles/:slug/favorite", (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };
      var data = JSON.parse(data.toString());
      const article = data.articles.articles.find(article => article.slug === req.params.slug);
      if (article) {
        article.favorited = false;
        article.favoritesCount--;
        data.tags.tags = [...new Set([...data.tags.tags])];
        fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {  // WRITE
          if (err) {
            const status = 401
            const message = err
            res.status(status).json({ status, message })
            return
          }
        }
        );
        return res.status(200).json({ article });
      }
      return res.status(404).json({ status: 404, message: 'Article not found' });
    });
  } else {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
})

// add new tag
server.post("/tags", (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  console.log(decoded);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };
      var data = JSON.parse(data.toString());
      data.tags.tags.push(req.body.tag);
      data.tags.tags = [...new Set([...data.tags.tags])];
      fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({ status, message })
          return
        }
      }
      );
      return res.status(200).json({ tag: req.body.tag });
    });
  } else {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
}
)


// add notification
server.post("/notifications", (req, res) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, SECRET_KEY);
  const user = userdb.users.find(user => user.email === decoded.email)
  if (user) {
    fs.readFile("./database.json", (err, data) => {
      if (err) {
        const status = 401
        const message = err
        res.status(status).json({ status, message })
        return
      };
      var data = JSON.parse(data.toString());
      if(req.body.article){
        data.notification.articles.push(req.body.article);
      }
      if (req.body.tag) {
        data.notification.tags.push(req.body.tag);
      }
      if (req.body.likeUnlike) {
        data.notification.likeUnlike.push(req.body.likeUnlike);
      }
      fs.writeFile("./database.json", JSON.stringify(data), (err, result) => {  // WRITE
        if (err) {
          const status = 401
          const message = err
          res.status(status).json({ status, message })
          return
        }
      }
      );
      return res.status(200).json({ notification: req.body });
    });
  } else {
    return res.status(404).json({ status: 404, message: 'User not found' });
  }
}
)


// get notifications
server.get("/notifications", (req, res) => {
  fs.readFile("./database.json", (err, data) => {
    if (err) {
      const status = 401
      const message = err
      res.status(status).json({ status, message })
      return
    };
    var data = JSON.parse(data.toString());
    return res.status(200).json({ notifications: data.notification });
  });
}
)

server.use(router)


var server1 = require("http").Server(server);


server1.listen(3000, () => {
  console.log('Run Auth API Server')
})

 //export server1
 module.exports = server1;