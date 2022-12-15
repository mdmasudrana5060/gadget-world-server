const express = require('express')
const app = express()
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();

const port = process.env.PORT || 5000

// middle ware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.2cacwdw.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        await client.connect();
        console.log('database connnected');
        const database = client.db("gadgetWorld");
        const productCollection = database.collection("products");
        const orderCollection = database.collection('orders');


        // get all products
        app.get('/products', async (req, res) => {

            const page = req.query.page;
            const size = parseInt(req.query.size);
            const query = {};
            const cursor = productCollection.find(query);
            const count = await cursor.count();

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
        app.post('/orders', async (req, res) => {
            const order = req.body;
            console.log(req.body);
            const result = await orderCollection.insertOne(order);
            res.json(result);

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