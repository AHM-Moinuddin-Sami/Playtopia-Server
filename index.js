const express = require('express');
const cors = require('cors');
require('dotenv').config();
const port = process.env.PORT || 5000;
const app = express();

app.use(cors());
app.use(express.json());


const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.xothnon.mongodb.net/?retryWrites=true&w=majority`;
let query = {};

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        client.connect();

        const database = client.db("PlaytopiaDB");

        const toysCollection = database.collection("toys");

        const galleryCollection = database.collection("galleryPhotos");

        app.get('/toys', async (req, res) => {
            const { page, limit, searchedToy, sort, email } = req.query;
            const currPage = parseInt(page) || 0;
            const pageLimit = parseInt(limit) || 20;
            const skip = currPage * pageLimit;
            let result;

            if (searchedToy) {
                query = { toyName: { $regex: searchedToy, $options: 'i' } };
            }
            else {
                query = {};
            }

            if (email) {
                query = { sellerEmail: email };
            }

            console.log(currPage, pageLimit, query);

            console.log(sort);
            if (sort) {
                const sorting = parseInt(sort);
                result = await toysCollection.find(query).sort({ price : sorting }).collation({locale: "en_US", numericOrdering: true}).limit(pageLimit).skip(skip).toArray();
            }
            else {
                result = await toysCollection.find(query).limit(pageLimit).skip(skip).toArray();
            }
            res.send(result);
        })

        app.get('/galleryPhotos', async(req, res)=>{
            console.log("Inside gallery");
            const result = await galleryCollection.find().toArray();
            res.send(result);
        })

        // .sort(sorting)..collation({locale: "en_US", numericOrdering: true}).toArray()

        app.get('/toys/:id', async (req, res) => {
            const id = req.params.id;

            console.log(id);

            const query = { _id: new ObjectId(id) }

            const result = await toysCollection.findOne(query);

            res.send(result);
        })

        app.put('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const update = req.body;

            const filter = { _id: new ObjectId(id) };

            const updateDoc = {
                $set: {
                    price: update.updatedPrice,
                    quantity: update.updatedQuantity,
                    description: update.updatedDescription
                }
            };

            console.log(id, update)

            const result = await toysCollection.updateOne(filter, updateDoc);

            res.send(result);
            // const filter = {new ObjectId(id)}
        })

        app.delete('/toys/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await toysCollection.deleteOne(query);
            res.send(result);
        })

        app.post('/toys', async (req, res) => {
            const newToy = req.body;
            const result = await toysCollection.insertOne(newToy);
            res.send(result);
        })


        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!');
})

app.listen(port, () => {
    console.log(`Playtopia listening on port ${port}`);
})