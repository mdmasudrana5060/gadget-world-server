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

function verifyJwt(req, res, next) {
    const authHeader = req.headers.authorization;
    console.log('inside verifyjwt function', authHeader);
    if (!authHeader) {
        return res.sendStatus(401).send({ message: "unauthorized access" })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.sendStatus(403).send({ message: ' forbidden' })
        }
        req.decoded = decoded;

        next()
    })


}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2cacwdw.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('database connnected');
        const database = client.db("gadgetWorld");
        const productCollection = database.collection("products");
        const orderCollection = database.collection('orders');


        // auth

        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            })
            res.send({ accessToken });
        })


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
        app.get('/orders', verifyJwt, async (req, res) => {
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