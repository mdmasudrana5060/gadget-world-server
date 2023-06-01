const express = require('express')
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000

// middle ware
app.use(cors());
app.use(express.json());

// function verifyJWT(req, res, next) {

//     const authHeader = req.headers.authorization;
//     if (!authHeader) {
//         return res.status(401).send('unauthorized access')
//     }
//     const token = authHeader.split(' ')[1];
//     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function (err, decoded) {
//         if (err) {
//             return res.status(403).send({ message: 'forbidden access' })
//         }
//         req.decoded = decoded;
//         next();
//     })
// }


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2cacwdw.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('database connnected');
        const database = client.db("gadgetWorld");
        const productCollection = database.collection("products");
        const orderCollection = database.collection('orders');
        const usersCollection = database.collection('users');


        // auth

        // app.post('/login', async (req, res) => {
        //     const user = req.body;
        //     const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET)
        //     res.send({ accessToken });
        // })


        // get all products
        app.get('/products', async (req, res) => {

            const page = req.query.page;
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = productCollection.find(query);
            // const count = await productCollection.count();
            const count = await productCollection.estimatedDocumentCount();
            let products;

            if (page) {
                products = await cursor.skip(page * size).limit(size).toArray();

            }
            else {
                products = await cursor.toArray();

            }

            res.send({ products, count });

        });
        // get single products
        app.get('/products/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const product = await productCollection.findOne(query);
            res.send(product)
        });


        // use post by keys
        app.post('/productsByKeys', async (req, res) => {
            const keys = req.body;
            const ids = keys.map(id => ObjectId(id))
            const query = { _id: { $in: ids } };
            const cursor = productCollection.find(query);
            const products = await cursor.toArray();
            res.send(products)

        })


        //post order
        app.post('/orders', async (req, res) => {
            const order = req.body;
            console.log(req.body);
            const result = await orderCollection.insertOne(order);
            res.json(result);

        })
        // get orders
        // app.get('/orders', verifyJWT, async (req, res) => {
        //     const email = req.query.email;
        //     const decodedEmail = req.decoded.email;
        //     console.log(decodedEmail);
        //     if (decodedEmail === email) {
        //         const query = { email };
        //         const cursor = orderCollection.find(query);
        //         const order = await cursor.toArray();
        //         res.send(order);

        //     }
        //     else {
        //         res.sendStatus(403)
        //     }





        // })
        app.get('/orders', async (req, res) => {
            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            console.log(decodedEmail);
            if (decodedEmail === email) {
                const query = { email };
                const cursor = orderCollection.find(query);
                const order = await cursor.toArray();
                res.send(order);

            }
            else {
                res.sendStatus(403)
            }





        })

        // jwt
        // app.get('/jwt', async (req, res) => {
        //     const email = req.query.email;

        //     const query = { email: email };
        //     const user = await usersCollection.findOne(query);
        //     console.log(user);
        //     if (user) {
        //         const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET);
        //         // const token = jwt.sign({ email }, process.env.ACCESS_TOKEN_SECRET, { expiresIn:'1h'});
        //         return res.send({ accessToken: token })
        //     }
        //     res.status(403).send({ accessToken: '' })

        // });

        // save user in the database from  signup page
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })





    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello from the gadget world!')
})

app.listen(port, () => {
    console.log(`gadget world listening on port ${port}`)
})