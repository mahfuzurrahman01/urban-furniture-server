const express = require('express');
const cors = require('cors')
const app = express()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const port = process.env.PORT || 5000;
require('dotenv').config()
const stripe = require("stripe")(process.env.STRIPE_SK)

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
        const wishlistCollection = client.db('urbanCollection').collection('wishlist')
        const newProductsCollection = client.db('urbanCollection').collection('newProducts')
        const paymentsCollection = client.db('urbanCollection').collection('payment')
        const advertiseCollection = client.db('urbanCollection').collection('advertise')
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
            const products = await newProductsCollection.find(query).toArray()
            res.send(products)
        })
        //post buyer bookings
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            const result = await bookingsCollection.insertOne(booking)
            res.send(result)
        })
        //get user bookings orders
        app.get('/bookings', async (req, res) => {
            const email = req.query.email;
            const query = { email: email }
            const result = await bookingsCollection.find(query).toArray()
            res.send(result)
        })
        //add to wishlist 
        app.post('/wishlist', async (req, res) => {
            const product = req.body;
            const result = await wishlistCollection.insertOne(product)
            res.send(result)
        })
        //get wishlist items
        app.get('/wishlist', async (req, res) => {
            const email = req.query.email;
            const query = { buyersEmail: email }
            const result = await wishlistCollection.find(query).toArray()
            res.send(result)
        })
        //get my products for seller 
        app.get('/myProducts', async (req, res) => {
            const email = req.query.email;
            const query = { sellerEmail: email }
            const result = await newProductsCollection.find(query).toArray()
            res.send(result)
        })
        //delete seller product
        app.delete('/myProducts/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await newProductsCollection.deleteOne(query)
            res.send(result)
        })
        //add new product
        app.post('/addProducts', async (req, res) => {
            const product = req.body;
            const result = await newProductsCollection.insertOne(product)
            res.send(result)
        })
        //newproducts collection find
        app.get('/newProducts', async (req, res) => {
            const query = {}
            const result = await newProductsCollection.find(query).toArray()
            res.send(result)
        })
        //update product role
        app.put('/newProducts/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: 'Sold'
                },
            };
            const result = await newProductsCollection.updateOne(filter, updateDoc, options)
            res.send(result)
        })
        //get a single product with id
        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;

            const query = { index: id }
            const result = await bookingsCollection.findOne(query);
            res.send(result)
        })

        //stripe use
        app.post("/create-payment-intent", async (req, res) => {
            const booking = req.body;
            const price = booking.price;
            const amount = price * 100
            const paymentIntent = await stripe.paymentIntents.create({
                currency: 'USD',
                amount: amount,
                "payment_method_types": [
                    "card"
                ],
            })
            res.send({
                clientSecret: paymentIntent.client_secret,
            });
        })
        //payment 
        app.post('/payments', async (req, res) => {
            const product = req.body;
            // const result = await paymentsCollection.insertOne(product)
            const id = product.bookingId;

            const filter = { index: id }
            const updateDoc = {
                $set: {
                    paid: true
                }
            }
            const updatedResult = await bookingsCollection.updateOne(filter, updateDoc)
            const filterTwo = { _id: ObjectId(id) }
            const updateDocTwo = {
                $set: {
                    status: "sold"
                }
            }
            const updateProducts = await newProductsCollection.updateOne(filterTwo, updateDocTwo)
            const query = { advertiseId: id }
            const result = await advertiseCollection.deleteOne(query)
            res.send(result)
        })
        //post advertise item on api
        app.post('/advertise', async (req, res) => {
            const product = req.body;
            const id = product.advertiseId;
            const query = { advertiseId: id }
            const item = await advertiseCollection.findOne(query)
            if (!item) {
                const result = await advertiseCollection.insertOne(product)
                return res.send(result)
            }
            res.send({ added: 'added' })

        })
        //getting advertise item.
        app.get('/advertise', async (req, res) => {
            const query = {}
            const result = await advertiseCollection.find(query).toArray()
            res.send(result)
        })
        //getting buyers for admin
        app.get('/allbuyers', async (req, res) => {
            const query = { role: 'buyer' }
            const buyers = await usersCollection.find(query).toArray()
            res.send(buyers)
        })
        // getting all sellers
        app.get('/allsellers', async (req, res) => {
            const query = { role: 'seller' }
            const sellers = await usersCollection.find(query).toArray()
            res.send(sellers)
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