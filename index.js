const express = require("express");
const app = express();
const port = process.env.PORT || 5000;
const cors = require("cors");
require("dotenv").config();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5173",
      "https://tech-views.web.app",
      "https://tech-views.firebaseapp.com/",
    ],
  })
);

app.use(express.json());

const { MongoClient, ServerApiVersion } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.308otot.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    const database = client.db("tech-view");
    const productCollection = database.collection("products");

    app.get("/products", async (req, res) => {
      const {
        search,
        category,
        priceRange,
        sort,
        page = 1,
        limit = 10,
      } = req.query;

      console.log(req.query);

      let query = {};
      let sortOption = {};
      const skip = (page - 1) * limit;
      const limitInt = parseInt(limit);

      if (search) {
        query.product_name = { $regex: search, $options: "i" };
      }

      if (category) {
        query.category = category;
      }

      if (priceRange) {
        const [minPrice, maxPrice] = priceRange.split("-").map(Number);
        query.price = { $gte: minPrice, $lte: maxPrice };
      }

      if (sort === "low-high") {
        sortOption.price = 1;
      } else if (sort === "high-low") {
        sortOption.price = -1;
      } else if (sort === "newest") {
        sortOption.product_creation_date = -1;
      }

      const products = await productCollection
        .find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(limitInt)
        .toArray();
      const totalProducts = await productCollection.countDocuments(query);
      const totalPages = Math.ceil(totalProducts / limitInt);

      res.send({ products, totalPages });
    });

    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Tech view server is running");
});

app.listen(port, () => {
  console.log("Tech view listening on port", port);
});
