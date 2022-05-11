const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
require("dotenv").config();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const jwt = require("jsonwebtoken");

app.use(cors());
app.use(express.json());
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });

  console.log("inside verify", authHeader);
}

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@inventory.ay8bv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});

async function run() {
  try {
    await client.connect();
    const productCollection = client.db("inventory").collection("products");
    const orderCollection = client.db("inventory").collection("order");

    //token
    app.post("/login", async (req, res) => {
      const user = req.body;
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "2d",
      });
      res.send({ accessToken });
    });

    app.get("/product", async (req, res) => {
      const query = {};
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      console.log(products);
      res.send(products);
    });
    app.get("/myItem", verifyJWT, async (req, res) => {
      const email = req.query.email;
      const query = { gmail: email };
      const cursor = productCollection.find(query);
      const products = await cursor.toArray();
      res.send(products);
    });

    app.get("/product/:id", async (req, res) => {
      const id = req.params.id;

      console.log(id);
      const query = { _id: ObjectId(id) };
      console.log(query);

      const product = await productCollection.findOne(query);
      res.send(product);
    });
    app.post("/product", async (req, res) => {
      const newService = req.body;
      console.log(newService);
      const result = await productCollection.insertOne(newService);
      res.send(result);
    });
    app.delete("/product/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };

      const result = await productCollection.deleteOne(query);
      res.send(result);
    });
    app.put("/product/:id", (req, res) => {
      const id = req.params.id;
      const val = req.query.value;
      console.log(val);
      const value = Number(req.body.val);

      const result = productCollection.updateOne(
        { _id: ObjectId(id) },
        { $inc: { quantity: value } }
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

// app.get("/apple", (req, res) => {
//   res.send([{ name: "Afridi" }, { name: "saad" }]);
// });

app.get("/", (req, res) => {
  res.send("hello");
});

app.listen(port, () => {
  console.log("Listening to server");
});
