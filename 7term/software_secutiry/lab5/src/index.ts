import express from "express";
import router from "./routes";
import path from "node:path";

const app = express();

app.use(express.json());

app.use(express.static(path.join(__dirname, "../public")));

app.use(router);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`);
});
