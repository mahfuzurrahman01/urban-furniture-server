const express = require('express');
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()

//middleware 
app.use(cors())
app.use(express.json())

//mongodb uri and client
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@clusterm01.jgnnfze.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
//mongodb
async function run() {
    try {
        const usersCollection = client.db('urbanCollection').collection('users')
        const productsCollection = client.db('urbanCollection').collection('products')
        const bookingsCollection = client.db('urbanCollection').collection('bookings')
        app.post('/adduser', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })
        //user role check
        app.get('/user/:email', async (req, res) => {
            const email = req.params.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query)
            res.send({ role: user.role })

        })
        //get products
        app.get('/products', async (req, res) => {
            const query = {}
            const result = await productsCollection.find(query).sort({ categoryId: 1 }).toArray()
            res.send(result)
        })
        //get products category wise
        app.get('/products/:id', async (req, res) => {
            const id = parseFloat(req.params.id);
            const query = { categoryId: id }
            const products = await productsCollection.find(query).toArray()
            res.send(products)
        })
        //post buyer bookings
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        })
    }
    finally {

    }
}

run().catch((err) => console.log(err))


app.get('/', (req, res) => {
    res.send('server is running')
})
app.listen(port, () => {
    console.log(`server is running on port ${port}`)
})