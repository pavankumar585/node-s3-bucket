const express = require("express");
const app = express();
const cors = require("cors");
require("dotenv").config();
require("./config/db")();
const posts = require("./routes/post");

app.set("view engine", "pug");
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/template", (req, res) => {
  res.render("index", { items: [1, 2, 3, 4], title: "template" });
});

app.use("/api/posts", posts);

app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err)
    return res.status(400).json({ error: "Bad JSON syntax" });

  next(err);
});

const port = process.env.PORT || 9000;
app.listen(port, () => console.log(`Server listening on port ${port}...`));
