const express = require("express");
const cors = require("cors");
const app = express();
const jwt = require("jsonwebtoken");
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

// jwt verify/check function
const verifyJWT = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "UnAuthorized Access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_TOKEN, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden Access" });
    }
    req.decoded = decoded;
    next();
  });
};

async function run() {
  try {
    await client.connect();
    const BlogCollections = client.db("flexiblog").collection("blogs");
    const UserCollections = client.db("flexiblog").collection("users");

    // verify admin function
    const verifyAdmin = async (req, res, next) => {
      const requester = req.decoded.email;
      const requesterAccount = await UserCollections.findOne({
        email: requester,
      });

      if (requesterAccount.role === "admin") {
        next();
      } else {
        res.status(403).send({ message: "Forbidden" });
      }
    };

    // make admin API
    app.put("/user/admin/:email", verifyJWT, async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const updateDoc = {
        $set: {
          role: "admin",
        },
      };

      const result = await UserCollections.updateOne(filter, updateDoc);
      res.send(result);
    });

    // get all blogs load
    app.get("/blogs", async (req, res) => {
      const result = await BlogCollections.find().toArray();
      res.send(result);
    });

    // get all users load
    app.get("/users",  async (req, res) => {
      const result = await UserCollections.find().toArray();
      res.send(result);
    });

    // step 1 => update one by one user specific by email..
    // step 2 => save registered user in db
    // step 3 => after completing all above this, giving every user a jwt token..

    app.put("/user/:email", async (req, res) => {
      const email = req.params.email;
      const filter = { email: email };
      const user = req.body;
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };

      const result = await UserCollections.updateOne(
        filter,
        updateDoc,
        options
      );
      // giving every user a jwt token
      const token = jwt.sign({ email: email }, process.env.JWT_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ result, accessToken: token });
    });

    // get just one blog  load by _id..get valid _id
    app.get("/blog/:id([0-9a-fA-F]{24})", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await BlogCollections.findOne(query);
      res.send(result);
    });

    // post server side validation for new blogs
    app.post("/blogs", async (req, res) => {
      const blog = req.body;
      // console.log('blog', blog)
      const result = await BlogCollections.insertOne(blog);
      res.send(result);
    });

    // delete blogs with _id
    app.delete("/blogs/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const result = await BlogCollections.deleteOne(filter);
      res.send(result);
    });

    app.post("/login", async (req, res) => {
      const user = req.body;
      console.log("user", user);
    });
  } finally {
    //   await client.close();
  }
}
run().catch(console.dir);

app.listen(PORT, () => {
  console.log("Server is running on port " + PORT);
});
