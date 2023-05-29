import express from 'express';
//import bodyParser from 'body-parser';
import bcrypt from 'bcrypt';
import cors from 'cors';
import knex from 'knex';

const db=knex({
    client: 'pg',
    connection: {
      host : '127.0.0.1',
      port : 5432,
      user : 'postgres',
      password : '99Srinivas$',
      database : 'smart-brain'
    }
  });
/* db.select('*').from('users').then(data=>{
    console.log(data)
 });
 */
const saltRounds =10;
const app =express();
app.use(express.json());
app.use(cors());

app.get('/',(req,res)=>{
    res.send('success');
})

app.post('/signin',(req,res)=>{
   /*bcrypt.compare("apples", '$2b$10$Ua8FEshyyqJ48SuIek3mHO.LOCRDpWS5D0p3yADQ0vWsZK8kgM.O6', function(err, res) {
        console.log('first guess',res);
    });
    bcrypt.compare("veggies",'$2b$10$Ua8FEshyyqJ48SuIek3mHO.LOCRDpWS5D0p3yADQ0vWsZK8kgM.O6', function(err, res) {
        console.log('second guess',res);
    });
   */
   db.select('email','hash').from('login')
   .where('email','=',req.body.email)
   .then(data =>{
    const isValid =bcrypt.compareSync(req.body.password,data[0].hash);
    if(isValid){
        return db.select('*').from('users')
        .where('email','=',req.body.email)
        .then(user =>{
            res.json(user[0])
        })
        .catch(err=>res.status(400).json('unable to get user'))
    }
    else{
        res.status(400).json('wrong credentials')
    }
   })
   .catch(err =>res.status(400).json('wrong credentials'))
})

app.post('/register',(req,res)=>{
   const {name,email,password}=req.body;
   if (!email || ! name || ! password){
    return res.status(400).json('incorrect form submission');
   }
   const hash = bcrypt.hashSync(password, saltRounds);
/*   bcrypt.hash(password, saltRounds, function(err, hash) {
    console.log(hash);
});
*/
db.transaction(trx=>{
    trx.insert({
        hash:hash,
        email:email
    })
    .into('login')
    .returning('email')
    .then(loginEmail=>{
        return trx ('users')
        .returning('*')
        .insert({
          email: loginEmail[0].email,
          name:name,
          joined: new Date()  
        })
        .then(user =>{
            res.json(user[0]);
        })
    })
    .then(trx.commit)
    .catch(trx.rollback)
})
.catch(err=>
    res.status(400).json('unable yo register'))
})

app.get('/profile/:id',(req,res)=>{
    const {id}=req.params;
    db.select('*').from('users').where({id:id})
    .then(user=>{
        if (user.length){
            res.json(user[0])
        }
        else{
            res.status(400).json('not found')
        }
    })
  
})

app.put('/image',(req,res)=>{
    const {id}=req.body;
    let found=false;
    db('users').where('id','=',id)
    .increment('entries',1)
    .returning('entries')
    .then(entries=>{
        res.json(entries[0].entries);
    })
    .catch(err=> res.status(400).json('unable to get entries'))
})

/*bcrypt.hash(myPlaintextPassword, saltRounds, function(err, hash) {
    // Store hash in your password DB.
});

// Load hash from your password DB.
bcrypt.compare(myPlaintextPassword, hash, function(err, result) {
    // result == true
});
bcrypt.compare(someOtherPlaintextPassword, hash, function(err, result) {
    // result == false
});
*/
app.listen(3000,()=>{
    console.log('app is running on port 3000');
})

