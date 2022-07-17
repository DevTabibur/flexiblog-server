const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const PORT = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

// middleware
app.use(cors());
app.use(express.json());

app.get("/", async (req, res) => {
  res.send("Hello World!");
});

// DB_USER : flexiblog
// DB_PASS: aHXWCLft0qR1MPvV

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hc4xz.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const BlogCollections = client.db("flexiblog").collection("blogs");

    // get all blogs load
    app.get("/blogs", async (req, res) => {
      const result = await BlogCollections.find().toArray();
      res.send(result);
    });


  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
