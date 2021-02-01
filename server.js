const express = require('express');
const bcrypt = require('bcrypt-nodejs')
const cors = require('cors');
const db = require('knex')({
    client: 'pg',
    connection: {
      host : 'postgresql-triangular-80012',
      connectionString: process.env.DATABASE_URL,
      ssl: {
          rejectUnauthorized: false
      }
    }
  });



const app = express();
app.use(express.json());
app.use(cors())


//Sign in 

app.post('/signin', (req, res) => {
    db.select('email', 'hash').from('login')
    .where('email', '=', req.body.email)
    .then(data => {
        const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
        if(isValid){
            return db.select('*').from('users')
            .where('email', '=', req.body.email)
            .then(user => {
                res.json(user[0]) 
            })
            .catch(err => res.status(400).json('Unable to get the user'))
        }
        else{
            res.status(400).json('Wrong Credentials')
        }
    })
    .catch(err => res.status(400).json('Wrong Credentials'))
})

//Registration

app.post('/register', (req, res) => {
    const { email, name, password } = req.body;
    var hash = bcrypt.hashSync(password);
    db.transaction(trx => {
        trx.insert({
            hash: hash,
            email: email
        })
        .into('login')
        .returning('email')
        .then(loginEmail => {
            return trx('users')
            .returning("*")
            .insert({
                email: loginEmail[0],
                name: name,
                joined: new Date()
            })
            .then(user => {
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    })
        
        .catch(err => res.status(400).json('UNABLE TO REGISTER'))
})

//id

app.get('/profile/:id', (req, res) => {
    const { id } = req.params;
    db.select('*').from('users').where({id})
        .then(user=>{
            user.length ? res.json(user[0]) : res.status(400).json('Not found')            
        })
        .catch(err => res.status(400).json('error getting user'))
})

//Image 

app.put('/image', (req, res) => {
    const { id } = req.body;
    db('users').where('id', '=', id)
    .increment('entries',1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0]);
    }).catch(err => res.status(400).json('Unable to get Entries'))
})

app.listen(process.env.PORT || 3000, () => {
    console.log(`app is running on port ${process.env.PORT}`);
})

